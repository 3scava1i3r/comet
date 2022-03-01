certoraRun certora/harness/CometHarnessWrappers.sol \
    --verify CometHarnessWrappers:certora/specs/GlobalCollateralAsset.spec  \
    --solc solc8.11 \
    --staging \
    --optimistic_loop \
    --rule  \
    --settings -useBitVectorTheory,-smt_hashingScheme=plainInjectivity,-deleteSMTFile=false,-postProcessCounterExamples=false \
    --msg "$1"