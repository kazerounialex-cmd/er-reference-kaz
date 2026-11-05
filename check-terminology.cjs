const {execFileSync}=require('node:child_process');
process.stdout.write(execFileSync('python3',['scripts/check-additive-terminology.py'],{encoding:'utf8'}));
