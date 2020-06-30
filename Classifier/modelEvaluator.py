# modelEvaluator
def evaluateModel(model):
    
    y_gold = model["target_codec"].transform( model["data"]["test"]["y"] )
    y_pred = model["test_predicted"]

    Ps = []
    Rs = []
    # len(y_gold)
    for i in range(0,len(y_gold)):
        
        rel = 0
        ret = 0
        rel_ret = 0

        for j in range(0,len(y_gold[i])): 
            if y_gold[i][j] > 0 or y_pred[i][j] > 0:

                if ( y_gold[i][j] > 0 ):
                    rel = rel+1

                if ( y_pred[i][j] > 0 ):
                    ret = ret+1

                if ( y_gold[i][j] == y_pred[i][j]):
                    rel_ret = rel_ret+1

        P = 0.0
        if ( ret > 0):
            P = rel_ret / ret
        
        R = rel_ret / rel

        Ps.append(P)
        Rs.append(R)

    #print( str(np.mean(Ps))+"--"+str(np.mean(Rs)) )
    return Ps,Rs


# simple_semtype_P, simple_semtype_R = evaluateModel(simple_semtype_model)

term_P, term_R = evaluateModel(term_model)
sim_P, sim_R = evaluateModel(simple_model)

cuis_P, cuis_R = evaluateModel(cuis_model)
semTypes_P, semTypes_R = evaluateModel(semTypes_model)

umls_P, umls_R = evaluateModel(umls_model)

##############

# stats.ttest_rel(sim_P, cuis_P)
# stats.ttest_rel(sim_R, cuis_R)

# stats.ttest_rel(sim_P, semTypes_P)
# stats.ttest_rel(sim_R, semTypes_R)

# stats.ttest_rel(sim_P, umls_P)
# stats.ttest_rel(sim_R, umls_R)

##############

def formatResult (met, lab1, lab2, P1, P2):
    pval = stats.ttest_rel(P1, P2).pvalue
    print( "[ "+ str(len(P1))+" ] "+met+ ", " +lab1+", "+lab2+", "+ str(np.around(np.mean(P1),3)) + ", "+ str(np.around(np.mean(P2),3)) + ", " + str(np.around(pval, 10)) )

def formatResultDiff (met, lab1, lab2, P1, P2):
    P1_diff = []
    P2_diff = []
    for n in range(0,len(P1)) :
        asum = P1[n] + P2[n]
        if asum > 0 and (asum == P1[n] or asum == P2[n]):
            P1_diff.append(P1[n])
            P2_diff.append(P2[n])
    P1 = P1_diff
    P2 = P2_diff
    formatResult(met, lab1, lab2, P1, P2)


print("sim vs cuis")
formatResult("precision", "sim", "cuis", sim_P, cuis_P)
formatResult("recall", "sim", "cuis", sim_R, cuis_R)

print("sim vs umls")
formatResult("precision", "sim", "umls", sim_P, umls_P)
formatResult("recall", "sim", "umls", sim_R, umls_R)

print("cuis vs umls")
formatResult("precision", "cuis", "umls", cuis_P, umls_P)
formatResult("recall", "cuis", "umls", cuis_R, umls_R)



print("sim vs cuis")
formatResultDiff("precision", "sim", "cuis", sim_P, cuis_P)
formatResultDiff("recall", "sim", "cuis", sim_R, cuis_R)

print("sim vs umls")
formatResultDiff("precision", "sim", "umls", sim_P, umls_P)
formatResultDiff("recall", "sim", "umls", sim_R, umls_R)

print("cuis vs umls")
formatResultDiff("precision", "cuis", "umls", cuis_P, umls_P)
formatResultDiff("recall", "cuis", "umls", cuis_R, umls_R)



evaluateModel(models["simple_"+str(split)])


# for mod in ["simple","cuis","semTypes","umls"]:

tot_sim_P = []
tot_sim_R = []
tot_cuis_P = []
tot_cuis_R = []
tot_semTypes_P = []
tot_semTypes_R = []
tot_umls_P = []
tot_umls_R = []


for split in range(1,6):
    print("Split: "+ str(split))
 
    sim_P, sim_R = evaluateModel(models["simple_"+str(split)])
    cuis_P, cuis_R = evaluateModel(models["cuis_"+str(split)])
    semTypes_P, semTypes_R = evaluateModel(models["semTypes_"+str(split)])
    umls_P, umls_R = evaluateModel(models["umls_"+str(split)])

    tot_sim_P = tot_sim_P + sim_P
    tot_sim_R = tot_sim_R + sim_R
    tot_cuis_P = tot_cuis_P + cuis_P
    tot_cuis_R = tot_cuis_R + cuis_R
    tot_semTypes_P = tot_semTypes_P + semTypes_P
    tot_semTypes_R = tot_semTypes_R + semTypes_R
    tot_umls_P = tot_umls_P + umls_P
    tot_umls_R = tot_umls_R + umls_R




metric = "precision"
all_Ps = [tot_sim_P, tot_cuis_P, tot_semTypes_P, tot_umls_P]
all_Rs = [tot_sim_R, tot_cuis_R, tot_semTypes_R, tot_umls_R]

all_names = ["sim", "semTypes", "cuis", "umls"]

def evaluateBySubset(metric, all_Ps, all_names):
    indices = []
    for r in range(0, len(all_Ps[0])):
        
        any_nonzero = False
        sum_all = 0
        allEquals = True

        for m in range(0, len(all_Ps)):
            sum_all = sum_all + all_Ps[m][r]
            
            if (m > 0):
                allEquals = all_Ps[m][r] == all_Ps[m-1][r] == allEquals
            

        
        if ( sum_all > 0):
            any_nonzero = True
            # print(any_nonzero)

        if ( any_nonzero and (not allEquals)):
            indices.append(r)


    print(str(len(all_Ps[0])) + " -- " + str(len(indices))+" : "+str( np.around( 100* (len(indices) / len(all_Ps[0])),2 ) )+"%" )

    for m in range(0, len(all_Ps)):
        for n in range(m+1, len(all_Ps)):
            first = np.take(all_Ps[m],indices)
            second = np.take(all_Ps[n],indices)
            pval = stats.ttest_rel(first, second).pvalue
            print( "[ "+ str(len(first))+" ] "+metric+ ", " +all_names[m]+", "+all_names[n]+", "
                    + str(np.around(np.mean(first),3)) + ", "
                    + str(np.around(np.mean(second),3)) + ", " 
                    + str(np.around(pval, 30)) )


evaluateBySubset("precision", all_Ps, all_names)

evaluateBySubset("recall", all_Rs, all_names )




#  (X_train_ss, X_test_ss, Y_train_ss, Y_test_ss)
# datasets[1][1][["docid","page"]].drop_duplicates()
    

# print("sim vs cuis")
# formatResultDiff("precision", "sim", "cuis", tot_sim_P, tot_cuis_P)
# formatResultDiff("recall", "sim", "cuis", tot_sim_R, tot_cuis_R)

# print("sim vs umls")
# formatResultDiff("precision", "sim", "umls", tot_sim_P, tot_umls_P)
# formatResultDiff("recall", "sim", "umls", tot_sim_R, tot_umls_R)

# print("cuis vs umls")
# formatResultDiff("precision", "cuis", "umls", tot_cuis_P, tot_umls_P)
# formatResultDiff("recall", "cuis", "umls", tot_cuis_R, tot_umls_R)

# len(tot_sim_R) 
# len(tot_umls_R)

# print("sim vs cuis")
# formatResult("precision", "sim", "cuis", tot_sim_P, tot_cuis_P)
# formatResult("recall", "sim", "cuis", tot_sim_R, tot_cuis_R)

# print("sim vs umls")
# formatResult("precision", "sim", "umls", tot_sim_P, tot_umls_P)
# formatResult("recall", "sim", "umls", tot_sim_R, tot_umls_R)

# print("cuis vs umls")
# formatResult("precision", "cuis", "umls", tot_cuis_P, tot_umls_P)
# formatResult("recall", "cuis", "umls", tot_cuis_R, tot_umls_R)


# evaluateBySubset(metric, [[0,0,1,1],[0,1,0,0.7],[0,0,1,1]], ["A1","A2","A3"])
