# if [[ "$1" ]]
# then
#     RULE="--rule $1"
# fi

certoraRun certora/harness/CometHarnessGetters.sol --verify CometHarnessGetters:certora/specs/pauseGuardians.spec  \
    --solc solc8.11 \
    --cloud \
    --rule $1 \
    --optimistic_loop \
    --settings -enableEqualitySaturation=false,-multiAssertCheck,-smt_usePz3=true,-smt_z3PreprocessorTimeout=2 \
    --solc_args '["--experimental-via-ir"]' \
    --msg "CometHarnessGetters:pauseGuardians.spec $1"
