'use client';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import { useMemo, useRef, Component, type ReactNode } from 'react';
import * as THREE from 'three';
function Cluster() {
  const group = useRef<THREE.Group>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  useFrame(({ clock, pointer }) => {
    if (group.current) { group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, pointer.y * 0.22 + 0.35, 0.04); group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, pointer.x * 0.3 + clock.elapsedTime * 0.035, 0.04); }
    if (material.current) material.current.uniforms.uTime.value = clock.elapsedTime;
  });
  const positions = [[0, 0], [0.91, 0.525], [0.91, -0.525], [0, 1.05], [0, -1.05], [-0.91, 0.525], [-0.91, -0.525]];
  return <Float speed={1.1} rotationIntensity={0.18} floatIntensity={0.4}><group ref={group} rotation={[0.35, 0.3, -0.25]}>{positions.map(([x, y], i) => <mesh key={i} position={[x, y, i % 3 * 0.13]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.58, 0.58, 0.29, 6]}/><shaderMaterial ref={i === 0 ? material : undefined} uniforms={uniforms} vertexShader={'varying vec3 vPosition; varying vec3 vNormal; void main(){ vPosition=position; vNormal=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }'} fragmentShader={'varying vec3 vPosition; varying vec3 vNormal; uniform float uTime; void main(){ float edge=abs(vNormal.y); float glow=sin(vPosition.x*5.+vPosition.z*3.+uTime*.4)*.12+.65; vec3 base=mix(vec3(.12,.18,.015),vec3(.776,1.,0.),glow); vec3 color=mix(base*.26,base,edge); gl_FragColor=vec4(color,1.); }'}/></mesh>)}<mesh rotation={[0.4, 0.5, 0]}><torusGeometry args={[2.05, 0.009, 5, 96]}/><meshBasicMaterial color="#C6FF00" transparent opacity={0.32}/></mesh><mesh rotation={[-0.5, 0.2, 1]}><torusGeometry args={[2.3, 0.006, 5, 96]}/><meshBasicMaterial color="#C6FF00" transparent opacity={0.17}/></mesh></group></Float>;
}
class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="hive-fallback" aria-hidden="true">⬡</div> : this.props.children; }
}
export default function HiveScene() {
  return <WebGLBoundary><Canvas fallback={<div className="hive-fallback" aria-hidden="true">?</div>} camera={{ position: [0, 0, 5.5], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }} aria-label="Interactive three-dimensional hexagonal hive"><Cluster/></Canvas></WebGLBoundary>;
}
