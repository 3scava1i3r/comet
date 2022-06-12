if [[ "$1" ]]
then
    RULE="--rule $1"
fi

certoraRun certora/harness/CometHarnessWrappers.sol \
    --verify CometHarnessWrappers:certora/specs/assetInfo.spec  \
<<<<<<< HEAD
    --solc solc8.13 \
    --cloud \
    --disable_auto_cache_key_gen \
    $RULE \
    --optimistic_loop \
    --settings -useBitVectorTheory,-smt_hashingScheme=plainInjectivity,-deleteSMTFile=false,-postProcessCounterExamples=false \
    --solc_args '["--experimental-via-ir"]' \
    --msg "CometHarnessWrappers:assetInfo.spec rule $RULE"
=======
    --solc solc8.11 \
    --cloud \
    $RULE \
    --send_only \
    --optimistic_loop \
    --settings -useBitVectorTheory,-smt_hashingScheme=plainInjectivity,-deleteSMTFile=false,-postProcessCounterExamples=false \
    --solc_args '["--experimental-via-ir"]' \
    --msg "CometHarnessWrappers:assetInfo.spec $RULE"
>>>>>>> upstream/certora
