#!/bin/bash
# Runs every tableQA A*.cy.js sequentially; one summary line per spec in tableQA/logs/summary.txt
cd "$(dirname "$0")"
D=cypress/e2e/happyPath/appbuilder/tableQA
: > $D/logs/summary2.txt
for n0 in $(sort -u $D/logs/rerun.txt); do s=$D/$n0.qa.js
  n=$(basename $s .cy.js)
  TQ_MAX=900 ./tqrun.sh $s > /dev/null 2>&1
  L=$D/logs/$n.log
  p=$(grep -Eo '[0-9]+ passing' $L | head -1); f=$(grep -Eo '[0-9]+ failing' $L | head -1)
  h=$(grep -q 'HANG GUARD' $L && echo ' HANG'); e=$(grep -q 'Oops...we found an error' $L && echo ' COMPILE-ERROR')
  echo "$n: ${p:-0 passing} ${f:-0 failing}$h$e" | tee -a $D/logs/summary2.txt
done
echo "BATCH DONE" | tee -a $D/logs/summary2.txt
