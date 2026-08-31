# Copying

FED-Shell is licensed under the **MIT License** — see the `LICENSE` file for
the full text.

## What that means (plain English)

- ✅ You can use FED-Shell commercially
- ✅ You can modify it
- ✅ You can distribute it
- ✅ You can ship apps built with it under any license you choose
- ✅ You can use it privately
- ❗ You must include the original copyright notice and license text in copies
- ❗ It comes with NO warranty — use at your own risk

## Your built apps

Apps you build with FED-Shell are **yours**. The MIT license covers FED-Shell
itself, not the output artifacts. You can release your wrapped apps under any
license — proprietary, GPL, or anything else.

## Third-party components

FED-Shell uses these third-party tools, each under their own licenses:

| Component | License | Purpose |
|---|---|---|
| [Capacitor](https://capacitorjs.com) | MIT | Mobile native bridge |
| [PySide6 / Qt](https://www.qt.io) | LGPLv3 / commercial | Desktop WebView engine |
| [PyInstaller](https://pyinstaller.org) | GPL (with exception) | Desktop packaging |
| [GitHub Actions](https://github.com) | Various | CI runners |

The Qt licensing (LGPL) deserves attention if you distribute the desktop
builds commercially: you must allow users to relink against a different Qt
version, or purchase a Qt commercial license. For most independent use cases
the LGPL terms are satisfied by keeping PySide6 dynamically linked (which is
the default). Consult a lawyer for specific advice.

## Attribution

If you fork or redistribute FED-Shell, please retain:

- The `LICENSE` file
- The copyright notice in `NOTICE.md`
- A link back to https://github.com/FED-OS/FED-Shell
