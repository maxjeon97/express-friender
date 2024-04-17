\echo 'Delete and recreate friender db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE friender;
CREATE DATABASE friender;
\connect friender

\i friender-schema.sql
\i friender-seed.sql

\echo 'Delete and recreate friender_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE friender_test;
CREATE DATABASE friender_test;
\connect friender_test

\i friender-schema.sql