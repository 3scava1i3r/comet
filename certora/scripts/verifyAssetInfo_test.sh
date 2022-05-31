if [[ "$1" ]]
then
    RULE="--rule $1"
fi

certoraRun certora/harness/CometHarnessWrappers_test.sol \
    --verify CometHarnessWrappers:certora/specs/assetInfo_test.spec  \
    --solc solc8.13 \
    --cloud \
    --disable_auto_cache_key_gen \
    $RULE \
    --optimistic_loop \
    --settings -useBitVectorTheory,-smt_hashingScheme=plainInjectivity,-deleteSMTFile=false,-postProcessCounterExamples=false \
    --solc_args '["--experimental-via-ir"]' \
    --msg "CometHarnessWrappers:assetInfo.spec rule $RULE"
