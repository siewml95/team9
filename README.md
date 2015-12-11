# team9

Since we have been focusing on the structure of the projects and testing out different kinds of software to use in this term. In this readme file, we will talking about how to make use different external components to extract tweets and insert them into a table and view them in table form

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
   SELECT SCHEMA_NAME FROM "HCP"."HCP_DEV_METADATA"; on the JAVA sql command.   
   
   You will get the schema name.  
  
   Then choose the fourth line, "SET SCHEMA NEO_;" and replace "NEO_" with your Schema Name and run the command on the sql    command in java.

   Now, go to the "02 setupTable.sql" and copy the code and paste in on the sql command and run it
   
5. Step 5 
   Assuming that you have a twitter account, now go to https://apps.twitter.com/app/new to create a new app and get the       Access Key.   
   
   Assuming that you have installed node.js in your computer, go to Live3HCP and go to nodejs folder and finally open the     app.js  
 
   Replace the consumer_key , consumer_secret, access_token_key and the access_token_secret in the app.js

6. Step 6

   Open the SAP HANA Cloud Platform SDK file and go to the tools and open the command line from there. Enter the following    line neo open-db-tunnel -h hanatrial.ondemand.com -i dev -a youraccountname  -u yourusername. Then enter your password. Remember to replace the dev with your instance name , youraccountname with your account name and yourusername with your username.  
          
   Get your USER and PASSWORD from the command prompt. And replace correctly in the app.js in the Live3HCP. Change the port    too.  
    
   Run the app.js   
   
   Now, go to a browser and insert URL localhost:8888/do/start?track=keyword 
   
   Replace the keyword in the url with any keyword you want search for in the tweets  
   
7. Step 7 
 
   Go to Java and open the folder named the same as your schema name and click on the folder Tables and left click the        Tweets and press Data Preview. This allow us to look at the tweets in the form of table. 

   
   
 
   



   



