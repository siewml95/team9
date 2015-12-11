# team9

Since we have been focusing on the structure of the projects and testing out different kinds of software to use in this term. In this readme file, we will talking about how to make use different external components to enable build the prototype shown in our demonstration in our video. 

1. Step 1   
   Download and install Eclipse IDE for Java EE Developers  
  
   Open eclipse and click on help and then click on install new software 
 
   Then enter "https://tools.hana.ondemand.com/luna" or "https://tools.hana.ondemand.com/mars" depending on your eclipse 
   version   
 
   Then choose SAP HANA CLOUD PLATFROM tools and SAP HANA tools and install them
 
2. Step 2  
   Register on this website, https://account.hanatrial.ondemand.com/   

   Log in using your account  
   
   Create a new HANA Instance. Ideally, call it dev  
   
   On the dashboard, click on Useful Links and click on tools  
   
   Then, click on the tab "CLOUD"   
   
   and download SAP HANA Cloud Platform SDK   
   

3. Step 3 
   Go back to Eclipse and add Add  Cloud System   
 
   Enter your credential 
 
   Then, choose dev or whatever you named your HANA instance as the instance.

   Download this file https://github.com/saphanaacademy/Live3HCP 
   
4. Step 4 
   Go to scripts folder  in the Live3HCP file and click on the first file , "01 setupSchema.sql" and run the first line,"
   SELECT SCHEMA_NAME FROM "HCP"."HCP_DEV_METADATA";  

   



