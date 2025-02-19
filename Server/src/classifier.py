import warnings
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)
import pandas as pd
import pickle
import sys
import json

model = pickle.load(open("/home/suso/ihw/TableTidier/Classifier/trained/umls_full.model", 'rb'))

def predict(data):

    c = ['clean_concept', 'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
        'is_empty_row_p', 'cuis', 'semanticTypes']

    customPredict = pd.DataFrame(
        data = data,
        columns = c)

    customPredict = customPredict[['clean_concept', 'is_bold', 'is_italic',
        'is_indent', 'is_empty_row', 'is_empty_row_p', 'semanticTypes']]

    return (model["target_codec"].inverse_transform(model["trained_model"].predict(customPredict)))

def groupedPredict( data ):

    c = ['clean_concept',
        'is_bold', 'is_italic', 'is_indent', 'is_empty_row',
        'is_empty_row_p', 'cuis', 'semanticTypes']

    customPredict = pd.DataFrame(
        data = data,
        columns = c)

    predictions = (model["target_codec"].inverse_transform(model["trained_model"].predict(customPredict)))

    terms = []
    classes = []

    for t in range(0,len(data)):
        terms.append(data[t][0])
        classes.append(";".join(predictions[t]))

    return({"terms": terms, "classes" : classes})

def printAll(data):
  print(data)
  return data

# import sys

def listen():
    while True:
        command = sys.stdin.readline()
        command = command.split('\n')[0]
        if command:
            print("Received CMD " + command)

if __name__ == '__main__':
    print(sys.argv[1])
    data = json.loads(sys.argv[1])
    listen()
