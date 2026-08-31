#!/bin/bash
# Convert ICP to cycles without color output
/home/neoweave/.local/share/dfx/bin/dfx cycles convert --amount=1.0 --network ic > /dev/null 2>&1
echo "Cycles conversion completed"


