import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '../../core/db';
import { assert } from '../../core/http';
import { env } from '../../config';
import { s3 } from './routes';
const run = promisify(execFile);
export function magicMatches(data: Buffer, mime: string) { if (mime === 'image/jpeg')
    return data.subarray(0, 3).equals(Buffer.from([255, 216, 255])); if (mime === 'image/png')
    return data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])); if (mime === 'image/webp')
    return data.toString('ascii', 0, 4) === 'RIFF' && data.toString('ascii', 8, 12) === 'WEBP'; if (mime === 'application/pdf')
    return data.toString('ascii', 0, 5) === '%PDF-'; if (mime === 'video/mp4')
    return data.toString('ascii', 4, 8) === 'ftyp'; return false; }
export async function processMedia(id: string) {
    const asset = await db.mediaAsset.findFirst({ where: { id, deletedAt: null } });
    if (!asset || asset.scanStatus === 'CLEAN' || asset.scanStatus === 'REJECTED')
        return;
    assert(asset.key && asset.mimeType && env.S3_BUCKET, 400, 'INVALID_MEDIA', 'Media configuration is incomplete.');
    assert(env.SCANNER_URL && env.SCANNER_SECRET, 503, 'SCANNER_UNAVAILABLE', 'Configure an authenticated virus scanning service before publishing uploads.');
    const source = await s3.send(new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: asset.key }));
    const bytes = Buffer.from(await source.Body!.transformToByteArray());
    if (bytes.length !== asset.sizeBytes || !magicMatches(bytes, asset.mimeType)) {
        await db.mediaAsset.update({ where: { id }, data: { scanStatus: 'REJECTED' } });
        return;
    }
    const scanUrl = await getSignedUrl(s3, new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: asset.key }), { expiresIn: 120 });
    const scan = await fetch(env.SCANNER_URL, { method: 'POST', headers: { Authorization: `Bearer ${env.SCANNER_SECRET}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ assetId: id, downloadUrl: scanUrl }), signal: AbortSignal.timeout(60000) });
    assert(scan.ok, 502, 'SCAN_FAILED', 'Virus scan service failed.');
    const result = await scan.json() as {
        clean?: boolean;
    };
    if (result.clean !== true) {
        await db.mediaAsset.update({ where: { id }, data: { scanStatus: 'REJECTED' } });
        return;
    }
    const folder = await mkdtemp(join(tmpdir(), 'trendhive-media-'));
    try {
        const file = join(folder, 'input');
        await writeFile(file, bytes);
        let duration: number | undefined;
        if (asset.type === 'video' || asset.type === 'image') {
            const probe = await run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', file], { timeout: 30000, maxBuffer: 1024 * 1024 });
            const info = JSON.parse(probe.stdout) as {
                format?: {
                    duration?: string;
                };
                streams?: {
                    width: number;
                    height: number;
                }[];
            };
            if (asset.type === 'video') {
                duration = Number(info.format?.duration);
                assert(Number.isFinite(duration) && duration > 0 && duration <= 180, 400, 'INVALID_DURATION', 'Videos must be 180 seconds or shorter.');
            }
            assert(info.streams?.some(s => s.width > 0 && s.height > 0 && s.width * s.height <= 40000000), 400, 'INVALID_DIMENSIONS', 'Media dimensions exceed limits.');
            if (asset.type === 'video') {
                const poster = join(folder, 'poster.jpg');
                await run('ffmpeg', ['-nostdin', '-y', '-ss', '0', '-i', file, '-frames:v', '1', '-vf', 'scale=720:-2', poster], { timeout: 30000 });
                const posterKey = `approved/${asset.uploadedBy}/${id}-poster.jpg`;
                await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: posterKey, Body: await readFile(poster), ContentType: 'image/jpeg' }));
                await db.mediaAsset.upsert({ where: { id: `${id}-poster` }, create: { id: `${id}-poster`, key: posterKey, type: 'image', url: env.CDN_URL ? `${env.CDN_URL}/${posterKey}` : '', section: asset.section, alt: asset.alt, uploadedBy: asset.uploadedBy, scanStatus: 'CLEAN', mimeType: 'image/jpeg' }, update: {} });
            }
        }
        const approvedKey = asset.key.replace(/^quarantine\//, 'approved/');
        await s3.send(new PutObjectCommand({ Bucket: env.S3_BUCKET, Key: approvedKey, Body: bytes, ContentType: asset.mimeType }));
        const promoted=await db.mediaAsset.updateMany({ where: { id,deletedAt:null }, data: { key: approvedKey, url: env.CDN_URL ? `${env.CDN_URL}/${approvedKey}` : '', scanStatus: 'CLEAN', duration } });if(!promoted.count)await purgeMedia(id);
    }
    finally {
        await rm(folder, { recursive: true, force: true });
    }
}

export async function purgeMedia(id:string){
 const asset=await db.mediaAsset.findFirst({where:{id,deletedAt:{not:null}}});if(!asset)return;
 for(const current of [asset,await db.mediaAsset.findUnique({where:{id:id+'-poster'}})]){if(!current)continue;
 if(current.key&&env.S3_BUCKET){const {DeleteObjectCommand}=await import('@aws-sdk/client-s3');for(const key of new Set([current.key,current.key.replace(/^approved\//,'quarantine/'),current.key.replace(/^quarantine\//,'approved/')]))await s3.send(new DeleteObjectCommand({Bucket:env.S3_BUCKET,Key:key}));}
 await db.mediaAsset.update({where:{id:current.id},data:{url:'',key:null,alt:'[removed]',finalPath:'',showcase:false,deletedAt:current.deletedAt??new Date()}});}
}
