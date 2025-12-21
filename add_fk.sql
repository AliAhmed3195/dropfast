ALTER TABLE "stripe_accounts" 
ADD CONSTRAINT stripe_accounts_businessId_fkey 
FOREIGN KEY ("businessId") 
REFERENCES "Business"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;
