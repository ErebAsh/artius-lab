"""
Artius Lab - Template Test Package
"""

import os

# Suppress GLib GIO volume monitor and VFS warnings on Windows
os.environ["GIO_USE_VOLUME_MONITOR"] = "unix"
os.environ["GIO_USE_VFS"] = "local"
