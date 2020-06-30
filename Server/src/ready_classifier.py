import pandas
from sklearn import model_selection
from sklearn.linear_model import SGDClassifier
import pickle
import sys
import json

sgd = pickle.load(open("/home/suso/ihw/tableAnnotator/Server/src/sgd_multiterm.sav", 'rb'))
