import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats
from scipy.stats import norm, skew
from sklearn import preprocessing
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_squared_error
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import make_pipeline
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.preprocessing import Binarizer
from sklearn.metrics import zero_one_loss
from sklearn.metrics import coverage_error
from sklearn.metrics import label_ranking_average_precision_score
from sklearn.metrics import r2_score
import math
import pickle

# data = pd.read_csv("/home/suso/ihw/tableAnnotator/tools/IHW_table_classifier/prediction_data_simple.csv")

# data = pd.read_csv("../../Server/training_data.csv")

data = pd.read_csv("../../Server/training_data_unique.csv")

def splitit(x):
    if type(x) == float:
        return ()
    return tuple(x.split(";"))

def reorderLabels(x):
    if type(x) == float:
        return ""
    else :
        return ";".join(sorted(str(x).split(";"))) 

def splitJoin(x):
    if x == 0:
        return []
    return " ".join(x.split(";"))

def toBool(x):
    if x > 0:
        return True
    else:
        return False


data["cuis"] = data["cuis"].fillna("")
data["semanticTypes"] = data["semanticTypes"].fillna("")
data["label"] = data["label"].fillna("")

data["cuis"] = data["cuis"].apply(splitJoin)
data["semanticTypes"] = data["semanticTypes"].apply(splitJoin)


data["label"] = data["label"].apply(reorderLabels)
# data["label"] = data["label"].apply(splitit)

# data["pos_start"] = data["pos_start"].apply(toBool)
# data["pos_middle"] = data["pos_middle"].apply(toBool)
# data["pos_end"] = data["pos_end"].apply(toBool)

data["is_bold"] = data["is_bold"].apply(toBool)
data["is_italic"] = data["is_italic"].apply(toBool)
data["is_indent"] = data["is_indent"].apply(toBool)
data["is_empty_row"] = data["is_empty_row"].apply(toBool)
data["is_empty_row_p"] = data["is_empty_row_p"].apply(toBool)

df = pd.DataFrame(data)

df = df.dropna(subset=['clean_concept'])
df = df.reset_index(drop=True)

# def tupleLength(x):
#     return len("".join(list(x)))


# df = df.loc[df['label'].apply(tupleLength) > 0, :]

df = df.loc[df['cuis'].apply(len) > 0, :]

df = df.reset_index(drop=True)

df_subset = df[["docid","page"]].drop_duplicates().sample(frac=0.7).reset_index(drop=True)

# df[["docid","page"]].drop_duplicates()

DF_TRAINING = pd.merge(df, df_subset, on=['docid','page'])
DF_TESTING = df[~df[['docid','page']].apply(tuple,1).isin(df_subset[['docid','page']].apply(tuple,1))]

df = DF_TRAINING


X = df[['docid','page', 'clean_concept', 'is_bold', 'is_italic','is_indent', 
        'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']]

Y = df[['label']]



# # NUM_BRANDS = 2500
# NAME_MIN_DF = 10
# MAX_FEAT_DESCP = 50000

# df["category_name"] = df["category_name"].fillna("Other").astype("category")
# df["brand_name"] = df["brand_name"].fillna("unknown")

# pop_brands = df["brand_name"].value_counts().index[:NUM_BRANDS]
# df.loc[~df["brand_name"].isin(pop_brands), "brand_name"] = "Other"

# df["item_description"] = df["item_description"].fillna("None")
# df["item_condition_id"] = df["item_condition_id"].astype("category")
# df["brand_name"] = df["brand_name"].astype("category")


def train_UMLS(X_train, X_test, y_train, y_test):

    cols = ['clean_concept', 'is_bold', 'is_italic',
        'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']
    
    X_train = X_train[cols].copy()
    X_test = X_test[cols].copy()

    preprocess = ColumnTransformer(
        [
        ('cuis', CountVectorizer(max_df=100), 'cuis'),
        ('semanticTypes', CountVectorizer(max_df=100), 'semanticTypes'),
        ('description_tfidf', TfidfVectorizer(stop_words = 'english', ngram_range=(1,3)), 'clean_concept')],
        remainder='passthrough')

    model = make_pipeline(
        preprocess,
        RandomForestClassifier(n_estimators = 100, n_jobs=-1))

    mlbin = MultiLabelBinarizer()
    y_train_multi = mlbin.fit_transform(y_train)

    model.fit(X_train, y_train_multi)

    return {"target_codec" : mlbin, "trained_model" : model, 
                        "data": { "train" : { "x" : X_train , "y" : y_train}, "test" : { "x" : X_test , "y" : y_test }  },
                        "test_predicted" : model.predict(X_test) }

def train_cuis(X_train, X_test, y_train, y_test):

    cols = ['clean_concept', 'is_bold', 'is_italic', 'is_indent', 
            'is_empty_row', 'is_empty_row_p', 'cuis']
    
    X_train = X_train[cols].copy()
    X_test = X_test[cols].copy()

    preprocess = ColumnTransformer(
        [
        ('cuis', CountVectorizer(max_df=100), 'cuis'),
        ('description_tfidf', TfidfVectorizer(stop_words = 'english', ngram_range=(1,3)), 'clean_concept')],
        remainder='passthrough')

    model = make_pipeline(
        preprocess,
        RandomForestClassifier(n_estimators = 100, n_jobs=-1))

    mlbin = MultiLabelBinarizer()
    y_train_multi = mlbin.fit_transform(y_train)

    model.fit(X_train, y_train_multi)

    return {"target_codec" : mlbin, "trained_model" : model, 
                        "data": { "train" : { "x" : X_train , "y" : y_train}, "test" : { "x" : X_test , "y" : y_test }  },
                        "test_predicted" : model.predict(X_test) }


def train_semTypes(X_train, X_test, y_train, y_test):

    cols = ['clean_concept', 'is_bold', 'is_italic',
        'is_indent', 'is_empty_row', 'is_empty_row_p', 'semanticTypes']
    
    X_train = X_train[cols].copy()
    X_test = X_test[cols].copy()

    preprocess = ColumnTransformer(
        [
        ('semanticTypes', CountVectorizer(max_df=100), 'semanticTypes'),
        ('description_tfidf', TfidfVectorizer(stop_words = 'english', ngram_range=(1,3)), 'clean_concept')],
        remainder='passthrough')

    model = make_pipeline(
        preprocess,
        RandomForestClassifier(n_estimators = 100, n_jobs=-1))

    mlbin = MultiLabelBinarizer()
    y_train_multi = mlbin.fit_transform(y_train)

    model.fit(X_train, y_train_multi)

    return {"target_codec" : mlbin, "trained_model" : model, 
                        "data": { "train" : { "x" : X_train , "y" : y_train}, "test" : { "x" : X_test , "y" : y_test }  },
                        "test_predicted" : model.predict(X_test) }

def train_semTypes_simple(X_train, X_test, y_train, y_test):

    cols = ['clean_concept', 'semanticTypes']
    
    X_train = X_train[cols].copy()
    X_test = X_test[cols].copy()

    preprocess = ColumnTransformer(
        [
        ('semanticTypes', CountVectorizer(max_df=100), 'semanticTypes'),
        ('description_tfidf', TfidfVectorizer(stop_words = 'english', ngram_range=(1,3)), 'clean_concept')],
        remainder='passthrough')

    model = make_pipeline(
        preprocess,
        RandomForestClassifier(n_estimators = 100, n_jobs=-1))

    mlbin = MultiLabelBinarizer()
    y_train_multi = mlbin.fit_transform(y_train)

    model.fit(X_train, y_train_multi)

    return {"target_codec" : mlbin, "trained_model" : model, 
                        "data": { "train" : { "x" : X_train , "y" : y_train}, "test" : { "x" : X_test , "y" : y_test }  },
                        "test_predicted" : model.predict(X_test) }

def train_simple(X_train, X_test, y_train, y_test):

    cols = ['clean_concept', 'is_bold', 'is_italic','is_indent', 'is_empty_row', 'is_empty_row_p']
    
    X_train = X_train[cols].copy()
    X_test = X_test[cols].copy()

    preprocess = ColumnTransformer(
        [('description_tfidf', TfidfVectorizer(stop_words = 'english', ngram_range=(1,3)), 'clean_concept')],
        remainder='passthrough')

    model = make_pipeline(
        preprocess,
        RandomForestClassifier(n_estimators = 100, n_jobs=-1))

    mlbin = MultiLabelBinarizer()
    y_train_multi = mlbin.fit_transform(y_train)

    model.fit(X_train, y_train_multi)

    return {"target_codec" : mlbin, "trained_model" : model, 
            "data": { "train" : { "x" : X_train , "y" : y_train}, "test" : { "x" : X_test , "y" : y_test }  },
            "test_predicted" : model.predict(X_test) }

def train_term(X_train, X_test, y_train, y_test):

    cols = ['clean_concept']
    
    X_train = X_train[cols].copy()
    X_test = X_test[cols].copy()

    preprocess = ColumnTransformer(
        [('description_tfidf', TfidfVectorizer(stop_words = 'english', ngram_range=(1,3)), 'clean_concept')],
        remainder='passthrough')

    model = make_pipeline(
        preprocess,
        RandomForestClassifier(n_estimators = 100, n_jobs=-1))

    mlbin = MultiLabelBinarizer()
    y_train_multi = mlbin.fit_transform(y_train)

    model.fit(X_train, y_train_multi)

    return {"target_codec" : mlbin, "trained_model" : model, 
            "data": { "train" : { "x" : X_train , "y" : y_train}, "test" : { "x" : X_test , "y" : y_test }  },
            "test_predicted" : model.predict(X_test) }


def eval_metrics(model):

    y_gold = model["target_codec"].transform( model["data"]["test"]["y"] )
    y_pred = model["test_predicted"]


    test_res = zero_one_loss( y_gold, y_pred)
    print('Zero_One_loss: %.4f' % test_res)

    test_res = coverage_error( y_gold, y_pred)
    print('coverage_error: %.4f' % test_res)

    test_res = label_ranking_average_precision_score( y_gold, y_pred)
    print('LRAP: %.4f' % test_res)

    test_res = r2_score( y_gold, y_pred)
    print('r2_score: %.4f' % test_res)


# X = X.dropna(subset=['clean_concept'])

target = Y.label
features = X[['docid','page','clean_concept',
    'is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']].copy()

X_train_full, X_test_full, Y_train_full, Y_test_full = train_test_split( features, target, test_size = 0.001, random_state=0 )

# X_train = X_train_docid[['clean_concept', 'is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']].copy()
# X_test = X_test_docid[['clean_concept', 'is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']].copy()
features_full = X[['clean_concept',
    'is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']].copy()

Y_train_full = list(map(lambda x: splitit(x), Y_train_full))
Y_test_full = list(map(lambda x: splitit(x), Y_test_full))



simple_full = train_simple(X_train_full, X_test_full, Y_train_full, Y_test_full)
cuis_full = train_cuis(X_train_full, X_test_full, Y_train_full, Y_test_full)
semTypes_full = train_semTypes(X_train_full, X_test_full, Y_train_full, Y_test_full)
umls_full = train_UMLS(X_train_full, X_test_full, Y_train_full, Y_test_full)



filenameRoot = "trained/"
# pickle.dump(term_model, open(filenameRoot+"term_only.model", 'wb'))
pickle.dump(simple_full, open(filenameRoot+"simple_full.model", 'wb'))
pickle.dump(cuis_full, open(filenameRoot+"cuis_full.model", 'wb'))
pickle.dump(semTypes_full, open(filenameRoot+"semTypes_full.model", 'wb'))
pickle.dump(umls_full, open(filenameRoot+"umls_full.model", 'wb'))

####
# term_model = train_term(X_train, X_test, y_train, y_test)
# simple_semtype_model = train_semTypes_simple(X_train, X_test, y_train, y_test)

# eval_metrics(simple_model)
# eval_metrics(cuis_model)
# eval_metrics(umls_model)
####

from sklearn.model_selection import ShuffleSplit

n_splits = 5
test_size = 0.3

sss = ShuffleSplit(n_splits=n_splits, test_size=test_size, random_state=1986)

# col_count = Counter(target) 
  
# # Here green is not in col_count  
# # so count of green will be zero 
# for color in col_count: 
#     print (color, col_count[color]) 


# list(map(lambda x: splitit(x), target))[39434]

# targetList = list(target)

# for t in range(1, len(targetList)):
#     if(len(targetList[t]) < 3):        
#         print(t)


datasets = {}
split = 1
models = {}

for train_index, test_index in sss.split(features, target):
    # print(split)   
    
    X_train_ss, X_test_ss = features.iloc[train_index], features.iloc[test_index]
    Y_train_ss, Y_test_ss = target[train_index], target[test_index]

    Y_train_ss = list(map(lambda x: splitit(x), Y_train_ss))
    Y_test_ss = list(map(lambda x: splitit(x), Y_test_ss))

    datasets[split] = (X_train_ss, X_test_ss, Y_train_ss, Y_test_ss)
    
    # cols = ['clean_concept',
    # 'is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']

    X_train = X_train_ss[['clean_concept','is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']]
    X_test = X_test_ss[['clean_concept','is_bold', 'is_italic', 'is_indent', 'is_empty_row', 'is_empty_row_p', 'cuis', 'semanticTypes']]
    Y_train = Y_train_ss
    Y_test = Y_test_ss

    simple_model = train_simple(X_train, X_test, Y_train, Y_test)
    cuis_model = train_cuis(X_train, X_test, Y_train, Y_test)
    semTypes_model = train_semTypes(X_train, X_test, Y_train, Y_test)
    umls_model = train_UMLS(X_train, X_test, Y_train, Y_test)

    print("Split: "+str(split))
    eval_metrics(simple_model)
    eval_metrics(cuis_model)
    eval_metrics(semTypes_model)
    eval_metrics(umls_model)

    models["simple_"+str(split)] = simple_model
    models["cuis_"+str(split)] = cuis_model
    models["semTypes_"+str(split)] = semTypes_model
    models["umls_"+str(split)] = umls_model

    

    split = split+1
