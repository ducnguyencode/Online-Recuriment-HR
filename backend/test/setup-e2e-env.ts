/** Runs before any e2e file imports AppModule (via Jest setupFiles). */
process.env.SKIP_SEED = 'true';
process.env.REQUIRE_EMAIL_VERIFICATION = 'false';
