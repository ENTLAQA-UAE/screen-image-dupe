-- Allow anonymous users to insert participants via group links
CREATE POLICY "Allow anonymous participant registration" 
ON public.participants 
FOR INSERT 
TO anon
WITH CHECK (true);

-- Allow anonymous users to read their own participant record (needed after insert)
CREATE POLICY "Allow anonymous to read own participant" 
ON public.participants 
FOR SELECT 
TO anon
USING (true);