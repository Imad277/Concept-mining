/**
 * Nominal ("branded") number types. They cost nothing at runtime but stop a
 * value in one unit from being passed where another unit is expected
 * (e.g. TH/s where PH/s is required, or USD cents where EUR cents are).
 */
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };
