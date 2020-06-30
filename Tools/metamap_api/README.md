Metamap api for nodejs

Rest api metamap homepage: https://documentation.uts.nlm.nih.gov/rest/home.html

Launching index.js in this folder will read in every file in the Tables directory. 

Read all "TD"" html tags as concepts that will be fed into the metamap server docker instance to extract CUIs and related information. 

The data generated is stored as: 

cui_def.csv : Cuis and related data
cui_concept.csv : actual strings and Cuis

cui_data_process.R : is a script to merge the cuis_recommend table with the generated data, for a complete/updated cuis_recommend table.


