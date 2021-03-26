# %%
from os import environ
from sqlalchemy import create_engine
import pandas as pd

db_uri = 'postgresql://postgres:melacome86@localhost:5432/ihw_annotator'

engine = create_engine(db_uri, echo=True)

# %%

# table_df = pd.read_sql_table(
#     table_name,
#     con=engine
# )

newer_sql_df = pd.read_sql(
    "SELECT * FROM public.metadata",
    con=engine
)

older_sql_df = pd.read_sql(
    "SELECT * FROM public.metadata_last_backup",
    con=engine
)


# %%
har_cuis = pd.read_csv("manual_har_terms.csv")
har_cuis = har_cuis.loc[pd.notnull(har_cuis.final_cui)]

# %%
def cuiReorder(cuis):
    if cuis is not None:
        return ";".join(sorted(cuis.split(";")))
    else: 
        return cuis


har_dict = {}

for har_index in har_cuis.index:    
    har_dict[cuiReorder(har_cuis.loc[har_index].cuis_selected)] = cuiReorder(har_cuis.loc[har_index].final_cui)

# %%
# har_dict

# %%
def cuis_har_replace (cuis, cuis_har_ref, cuis_har_replacement):
    found = 0
    for c in cuis:
        if c in cuis_har_ref:
            found = found + 1
    if ( found/len(cuis_har_ref) == 1 ):
        return cuis_har_replacement
    else: 
        return cuis

# %%
from collections.abc import Iterable

def flatten(l):
    for el in l:
        if isinstance(el, Iterable) and not isinstance(el, (str, bytes)):
            yield from flatten(el)
        else:
            yield el


def associateHars(cus, har_dict):
    cus = cus.split(";")
    foundAny = True
    newCus = list([])
    totalSubstitutions = 0

    while (foundAny):
        alreadyChecked = list([])

        for ngramlen in range(1,len(cus)+1):
            for i in range(0,len(cus)):
                sl = cus[i:(i+ngramlen)]
                alreadyChecked.append(";".join(sl))

        options = sorted(list(set(alreadyChecked)), key=len, reverse=True)

        foundAny = False
        if ( len(options) > 0 ):
            for o in options:
                if o in har_dict:
                    foundAny = True
                    newCus.append(har_dict[o])
                    totalSubstitutions = totalSubstitutions+1

                    for c in o.split(";"):
                        cus.remove(c)
                    break
        # breakpoint()
        if not foundAny:
            return ";".join(list(flatten([cus,newCus]))),totalSubstitutions
            # break

# cuiReorder(associateHars('C0042469;C0279936;C0332132;C1999216;C1999216', har_dict))

# %%
from fastDamerauLevenshtein import damerauLevenshtein

# %%

# %%

# %%
def doMetadataMerge( newer, older ):
    sel_index = []
    TotalSubs = 0
    merged_table_metadata = []

    for new_index in range(0,len(newer)):

        minDis = -1
        rowBuffer = newer[new_index]
        lastSim = -1
        lastIndex = -1
        c1 = newer[new_index]["concept"].lower()

        for old_index in range(0,len(older)):
        
            # print(sel_index)
            if old_index in sel_index:
                continue

            c2 = older[old_index]["concept"].lower()
            dis = damerauLevenshtein(c1, c2, similarity=False) 
            sim = damerauLevenshtein(c1, c2, similarity=True)
        
            if ( (minDis < 0) or (dis < minDis) ):
                if (sim > 0.40):                
                    proposedCuis = cuiReorder(older[old_index]["cuis_selected"])

                    if proposedCuis is not None:
                        assHars, totals = associateHars(proposedCuis, har_dict)
                        TotalSubs = TotalSubs+totals
                        proposedCuis = cuiReorder(assHars)
                    else: 
                        proposedCuis = ""

                    rowBuffer["cuis"] = proposedCuis
                    rowBuffer["cuis_selected"] = proposedCuis
                    # rowBuffer["cuis_selected_old"] = older[old_index]["cuis_selected"]
                    rowBuffer["labeller"] = older[old_index]["labeller"]
                    minDis = dis
                    lastSim = sim
                    lastIndex = old_index

        sel_index.append(lastIndex)
        merged_table_metadata.append(rowBuffer)
        # newCuis = cuis_har_replace(rowBuffer.cuis.split(";"), rowBuffer.cuis_selected.split(";"), "C1518422".split(";"))
        # if rowBuffer is not None:
        # print(str(lastSim)+ " -- "+str(minDis)+" = " + c1 + " -- " + str(rowBuffer.concept))
    return merged_table_metadata,TotalSubs



# %%
all_new_metadata = None
totalSubstitutions = 0

for tid in set(newer_sql_df["tid"]):

    # print(tid)

    newer = newer_sql_df[ newer_sql_df["tid"] == tid ].to_dict(orient='records')
    older = older_sql_df[ older_sql_df["tid"] == tid ].to_dict(orient='records')

    newMetadata, totals = doMetadataMerge( newer, older )
    totalSubstitutions = totalSubstitutions+totals
    tableMetadataMerged = pd.DataFrame( newMetadata )

    if all_new_metadata is None:
        all_new_metadata = tableMetadataMerged
    else:
        all_new_metadata = all_new_metadata.append(tableMetadataMerged)


# %%
# all_new_metadata.to_sql('metadata_harmonised', engine, index=False)
# %% 

# from fastDamerauLevenshtein import damerauLevenshtein
# # damerauLevenshtein('ca', 'abc', similarity=False)  # expected result: 2.0
# # damerauLevenshtein('car', 'car', similarity=False)  # expected result: 0.75
# # damerauLevenshtein(['ab', 'bc'], ['ab'], similarity=False)  # expected result: 1.0
# # damerauLevenshtein(['ab', 'bc'], ['ab'], similarity=True)  # expected result: 0.5
# totalSubstitutions

