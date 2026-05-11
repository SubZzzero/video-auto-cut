# PyInstaller build spec for the packaged local Windows app.

from pathlib import Path

from PyInstaller.utils.hooks import collect_data_files, collect_dynamic_libs, collect_submodules

project_root = Path(SPECPATH)
ui_dist_directory = project_root / "ui" / "dist"
ffmpeg_directory = project_root / "ffmpeg"

datas = collect_data_files("cv2")
binaries = collect_dynamic_libs("cv2")
hiddenimports = collect_submodules("cv2") + collect_submodules("uvicorn") + ["multipart"]

if ui_dist_directory.exists():
    datas.append((str(ui_dist_directory), "ui/dist"))

if ffmpeg_directory.exists():
    datas.append((str(ffmpeg_directory), "ffmpeg"))


a = Analysis(
    [str(project_root / "scripts" / "run_packaged.py")],
    pathex=[str(project_root)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=None,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=None)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="VideoAutoCutter",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name="VideoAutoCutter",
)
