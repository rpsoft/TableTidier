# modelRunner

import pandas
from sklearn import model_selection
from sklearn.linear_model import SGDClassifier

import sys
import json

import numpy as np


import pandas as pd
import pickle

# model = pickle.load(open("trained/term_only.model", 'rb'))

# model = pickle.load(open("trained/simple_model.model", 'rb'))

model = pickle.load(open("trained/cuis_full.model", 'rb'))


model = semTypes_full
# def classify(h):
#     d={}
#     result = sgd.predict(h)
#     for r in range(0,len(h)):
#         d[h[r]] = result[r]
#     return d

# def classifyThreshold(h,threshold):
#     d={}
#     result = sgd.predict(h)
#     probs = sgd.decision_function(h)
#     for r in range(0,len(h)):
#         innerProbs = probs[r]
#         maximum = np.max(innerProbs)
#         if ( maximum > threshold):
#             d[h[r]] = result[r]
#         else:
#             d[h[r]] = ""
#     return d


def predict(data):    

    c = ['clean_concept',
        'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
        'is_empty_row_p', 'cuis', 'semanticTypes']

    customPredict = pd.DataFrame(    
        data = data,
        columns = c)

    return (model["target_codec"].inverse_transform(model["trained_model"].predict(customPredict)))


def groupedPredict( data ):
    
    terms = []

    predictions = predict(data)

    classes = []

    for t in range(0,len(data)):
        terms.append(data[t][0])
        classes.append(";".join(predictions[t]))
    

    df = pd.DataFrame({"clean_terms": terms, "classes": classes})

    return df


# input = [["mean sd", 0, 0, 0, 0, 0, "", ""],['race white', 0, 0, 0, 0, 0, '', '']]

# groupedPredict(input)

# predict(input)



##Interesting stuff here. How the tree makes a decision as to what label is chosen. 
##Probability of 0 has to be lower than probability of 1 for each class!.

c = ['clean_concept', 'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
        'is_empty_row_p', 'cuis', 'semanticTypes']
    
c = ['clean_concept', 'is_bold', 'is_italic',
        'is_indent', 'is_empty_row', 'is_empty_row_p', 'semanticTypes']

customPredict = pd.DataFrame(    
    data = [["mean sd", 0, 0, 0, 0, 0, "", ""]],
    columns = c)

customPredict[['clean_concept', 'is_bold', 'is_italic',
        'is_indent', 'is_empty_row', 'is_empty_row_p', 'semanticTypes']]
 

model["trained_model"].semanticTypes

model["trained_model"]

model["trained_model"].predict_proba(customPredict)

model["trained_model"].classes_

(model["target_codec"].inverse_transform(model["trained_model"].predict(customPredict)))

model["target_codec"].classes_

model["trained_model"]

probs = model["trained_model"].predict_proba(customPredict)

for p in range(0,len(probs)):
    print(str(probs[p][0][0]) 
                +" -- "+ str(probs[p][0][1]) + ": "+ str(probs[p][0][0] < probs[p][0][1] ) 
                + " : "+ str(probs[p][0][0] - probs[p][0][1] ))




# def getTopConfidenceTerms(df,threshold = -0.5):
#     df = df.sort_values(by=['confidence'], ascending=False)
#     mean = np.percentile(df["confidence"], 90)
#     df = df[df["confidence"] > threshold]
#     return df[df["confidence"] > mean]["classes"].values





# def predict(data):    

#     c = ['clean_concept', 'onlyNumbers', 'pos_start', 'pos_middle', 'pos_end',
#         'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
#         'is_empty_row_p', 'cuis', 'semanticTypes']

#     customPredict = pd.DataFrame(    
#         data = [data],
#         columns = c)

#     # X_train.iloc[[6000]]
#     return ";".join((model["target_codec"].inverse_transform(model["trained_model"].predict(customPredict)))[0])


da = [['combination treatment ifx aza', False, 0, 0, 0, 1, 0, 0, 0, 0, 'C0020823 C0004482', 'orch phsu hops orch phsu']]
da = [
        ['combination treatment ifx aza', 0, 0, 0, 0, 0, 0, 0, 0, 0, '', ''],
        ['aspirin', 0, 0, 0, 0, 0, 0, 0, 0, 0, '', '']
    ]

c = ['clean_concept', 'pos_start', 'pos_middle', 'pos_end',
        'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
        'is_empty_row_p', 'cuis', 'semanticTypes']

customPredict = pd.DataFrame(    
    data = [['odds ratio $nmbr$ ci', 0, 0, 0, 1, 0, 0, 0, 0, 'C0020823 C0004482', 'orch phsu hops orch phsu']],
    columns = c)

model["trained_model"].predict(customPredict)


# data = d
# model = umls_model
# da = umls_model["data"]["test"]["x"].iloc[[6000]]
# groupedPredict(da)



# customPredict = pd.DataFrame(    
#     data = [da],
#     columns = c)

# term_model["trained_model"].predict(customPredict)
# term_model["trained_model"].predict_proba(customPredict)

# term_model["trained_model"][1].n_outputs_

# for i in term_model["trained_model"][1].feature_importances_:
#     print(i)



DF_TESTING[["docid","page"]].drop_duplicates().to_csv("testing_tables_list.csv", index=False)

