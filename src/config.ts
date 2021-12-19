// ///////////////////////////////////////////////////////////////////////
// Configuration variables to rise alerts of possible Phishing Attacks
// ///////////////////////////////////////////////////////////////////////


// Minimum number of transaction calls to `approve()` or `increaseAllowance()` to consider a behavior as suspicious
export const MINIMUM_NUMBER_OF_APPROVALS = 10;

// Period duration (in blocks) of observation of transaction calls to `approve()` or `increaseAllowance()`
export const OBSERVATION_PERIOD_DURATION = 6000;
