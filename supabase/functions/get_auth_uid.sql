
-- This is an edge function to help debug auth.uid() issues
CREATE OR REPLACE FUNCTION public.get_auth_uid()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN auth.uid();
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_auth_uid() TO authenticated;
