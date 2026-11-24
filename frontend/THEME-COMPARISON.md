# Theme comparison

Dark is the default, independent of operating-system preferences. Use the Sun/Moon control in the website or dashboard header. The choice is stored under trendhive-theme in localStorage and applied by an inline head initializer before paint.

| View | Dark | Light |
| --- | --- | --- |
| Brand landing, desktop | [Screenshot](artifacts/theme/brand-dark-desktop.png) | [Screenshot](artifacts/theme/brand-light-desktop.png) |
| Brand landing, mobile | [Screenshot](artifacts/theme/brand-dark-mobile.png) | [Screenshot](artifacts/theme/brand-light-mobile.png) |
| Full brand page | [Screenshot](artifacts/theme/brand-dark-full.png) | [Screenshot](artifacts/theme/brand-light-full.png) |
| Dashboard, desktop | [Screenshot](artifacts/theme/dashboard-dark-desktop.png) | [Screenshot](artifacts/theme/dashboard-light-desktop.png) |
| Dashboard, mobile | [Screenshot](artifacts/theme/dashboard-dark-mobile.png) | [Screenshot](artifacts/theme/dashboard-light-mobile.png) |

The light palette uses warm paper, white surfaces, soft tinted value cards, readable olive/berry/violet text accents and the original acid-lime and magenta action colors. Media overlays retain their white text and video scrims.

The original global stylesheet is unchanged. Appearance tokens and section color adaptations live in src/app/themes.css. Shared chart colors, map markers and canvas particles also read the theme tokens. No backend or API behavior was changed.

Some external dummy images are unavailable in this sandbox; screenshots preserve those existing media references rather than replacing site assets. Screenshots use reduced motion so all content can be compared consistently.

Verification artifacts include the original dark computed-style baseline and a desktop/mobile route coverage report in artifacts/theme. The automated contrast scan is a supplemental DOM color check, not a complete accessibility certification.
