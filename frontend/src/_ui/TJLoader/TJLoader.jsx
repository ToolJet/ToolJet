import React from 'react';
import { LottieLoader } from '@/_ui/LottieLoader';

/**
 * Canonical in-app loading state. Renders the same animation as the boot loader in
 * index.ejs so there is one loading visual across the whole product.
 *
 * Kept as a separate export because it is imported from ~19 call sites, including the
 * ee submodule.
 */
export const TJLoader = () => <LottieLoader />;
