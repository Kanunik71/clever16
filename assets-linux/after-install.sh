#!/bin/bash

# Link to the binary
ln -sf /opt/clever16/Clever16 /usr/local/bin/clever16

# Launcher icon
desktop-file-install /opt/clever16/clever16.desktop
