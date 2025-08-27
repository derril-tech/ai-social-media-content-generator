-- Install pgvector extension for vector similarity search
-- This script assumes pgvector has been installed in the PostgreSQL instance

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify pgvector installation
DO $$
BEGIN
    -- Test basic vector operations
    CREATE TEMP TABLE test_vector AS SELECT '[1,2,3]'::vector AS v;
    RAISE NOTICE 'pgvector extension successfully installed and working';
EXCEPTION
    WHEN undefined_function THEN
        RAISE EXCEPTION 'pgvector extension is not properly installed';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error testing pgvector: %', SQLERRM;
END $$;
