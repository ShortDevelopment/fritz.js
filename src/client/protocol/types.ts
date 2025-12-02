import * as v from "@valibot/valibot";

export const FritzTrue = v.literal("1");
export const FritzFalse = v.literal("0");
export const FritzBool = v.union([FritzFalse, FritzTrue]);
