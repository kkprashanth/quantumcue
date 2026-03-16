# predict module to check model specs

import numpy as np
import matplotlib.pyplot as plt
import pprint
import os
from datetime import datetime
    
import imgs_2_AB_module as ab

_verbose = False

def compare_results(A, B, vars_list_qci, vars_list_exact):

    # converting arguments to required types
    A = np.array(A, dtype='f')
    B = np.array(B, dtype='f')
    vars = np.array(vars_list_qci)
    vars_exact_np = np.array(vars_list_exact)
    
    # calculating abs and rel errors
    abs_err =  round(np.linalg.norm(vars-vars_exact_np),5)
    rel_err =  round(np.linalg.norm(vars-vars_exact_np)/np.linalg.norm(vars_exact_np), 4) #in percent
    
    def get_residue_as_str(A, B, X):
        r = np.linalg.norm(np.matmul(A,X) - B)
        return f"{r:.2f}"
    
    res_QCI = get_residue_as_str(A, B, vars)
    res_AXB = get_residue_as_str(A, B, vars_exact_np)

    def print_long_X(X):
        """ print long  vector X"""
        len_prn = 5
        if len(X) <= len_prn:
            #print full X
            print(X)
        else:
            # print only first len_prn elements of X
            print("[", end="")
            for i in range(len_prn):
                print(f"{round(X[i],4)}, ", end="")
            print("... ]")
        
    print(f"\nAX=B answer: w_AXB = ", end="")
    print_long_X(vars_exact_np)
    print(f"QCI answer: w_QCI = ", end="")
    print_long_X(vars_list_qci)
    
    print("\nAbs norm of error |w_QCI-w_AXB|=", round(abs_err,3))
    print("Relative norm of error |w_QCI-w_AXB|/|w_AXB|=", round(rel_err, 3))
    
    print("\nResidue ||A.X-B|| for AX=B answer =", res_AXB)
    print("Residue ||A.X-B|| for QCI answer =", res_QCI)

    print(f"\nmin(w_AXB) = {round(min(vars_list_exact),3)}; max(w_AXB) = {round(max(vars_list_exact),3)}")
    print(f"min(w_QCI) = {min(vars_list_qci)}; max(w_QCI) = {max(vars_list_qci)}")
    
    PRINT_THIS_4 = False
    if PRINT_THIS_4:
        print("\nvar#, exact,  qc:")
        print(  "-------------------------")
        for i in range(len(vars_list_qci)):
            print("{}\t{}\t{}".format(i+1, round(vars_list_exact[i],3), round(vars_list_qci[i],3)))

        #print("answer_energy =", sample_set.first[1])
        #print("answer_num_occur =", sample_set.first[2])
        print()

def get_model_specs(A, B, weights, threshold, linear_resolution, RESCALE_B, RESCALE_PREDICTION):
    """ Get model specs at given threshold and linear resolution.
    Return acccuracy, tp, fp, ..., tpr, fpr, ... packed as a dict
    """
        
    nn = len(A)
    predictions = []
    true_labels = []
    
    #renormalizing threshold
    if RESCALE_B:
        threshold = ab.normalize_label(threshold, linear_resolution)
    
    eps = 0.0000000001 #threshold to determine integer label = 0 or 1
    for i in range(nn):
        #read image
        image_line = np.array(A[i])
        #calc prediction
        pred = np.matmul(image_line, weights)
        #RESCALE_PREDICTION
        if RESCALE_PREDICTION:
            pred = 0.5*(1.0 + np.tanh(pred))
        #compare with threshols, make binary prediction
        if pred < threshold:
            prediction = 0
        else:
            prediction = 1
        predictions.append(prediction)
        #make binary label (0 or 1) from renormalized labels B
        if B[i] < eps:
            label = 0
        else:
            label = 1
        true_labels.append(label)
            
    # calculate model specs: accuracy, TP, TN, etc
    correct, true_positive, false_positive = 0, 0, 0
    true_negative, false_negative = 0, 0
    
    for i in range(nn):
        #cycle over all labels and calculate the model specs
        true_label = true_labels[i]
        predicted_label = predictions[i]
        
        #accuracy
        if predicted_label == true_label:
            correct += 1
        
        # true positive
        if true_label == 1 and predicted_label == 1:
            true_positive += 1
        
        # true negative
        if true_label == 0 and predicted_label == 0:
            true_negative += 1
        
        # false positive:
        if true_label == 0 and predicted_label == 1:
            false_positive += 1
        
        # false negative:
        if true_label == 1 and predicted_label == 0:
            false_negative += 1
        
    # Calculating the rates
    accuracy = float(correct) / float(nn)
    
    # zero demnominator indicator:
    r = - 0.1
    #checking zero denominator for each spec:
    if true_positive + false_negative == 0:
        true_positive_rate = r
    else:
        true_positive_rate = float(true_positive) / float(true_positive + false_negative)
    
    if true_negative + false_positive == 0:
        true_negative_rate = r
    else:
        true_negative_rate = float(true_negative) / float(true_negative + false_positive)
        
    if false_positive + true_negative == 0:
        false_positive_rate = r
    else:
        false_positive_rate = float(false_positive) / float(false_positive + true_negative)
    
    if true_positive + false_negative == 0:
        false_negative_rate = r
    else:
        false_negative_rate = float(false_negative) / float(true_positive + false_negative)
    
    if true_positive + false_positive == 0:
        precision = r
    else:
        precision = float(true_positive) / float(true_positive + false_positive)
    
    if _verbose:
        print("\nThreshold =", threshold)
        print("correct =", correct, " out of ", nn )
        print("true positive =", true_positive)
        print("true negative =", true_negative)
        print("false positive =", false_positive)
        print("false negative =", false_negative)
        print("accuracy =", accuracy)
        print("precision =", precision)
        print("true_positive_rate (recall) =", true_positive_rate)
        print("true_negative_rate =", true_negative_rate)
        print("false_positive_rate =", false_positive_rate)
        print("false_negative_rate =", false_negative_rate)
    
    #packing the result to return
    specs = {"correct": correct, "total": nn, "true_positive": true_positive,
        "false_positive": false_positive, "true_negative": true_negative,
        "false_negative": false_negative, "accuracy": accuracy,
        "true_positive_rate": true_positive_rate,
        "true_negative_rate": true_negative_rate,
        "false_positive_rate": false_positive_rate,
        "false_negative_rate": false_negative_rate,
        "precision": precision}
    return specs


def get_weights_range(weights):
    """
    Get range of weights
    """
    w_min = min(weights)
    w_max = max(weights)
    return w_min, w_max

def make_report(model_name, linear_resolution, specs, SHOW_GRAPHS):
    """ Make a report for the model
    """
    if _verbose:
        print("Model name =", model_name)
        print("Specs =")
        pprint.pprint(specs)
    
    weight_range = specs["weight_range"]
    specs_on_threshold = specs["specs_on_threshold"]
    
    # Create dir "results" to save .dat files
    results_dir = './results/'
    try:
        os.makedirs(results_dir, exist_ok=True)
        if _verbose:
            print(f"Directory '{results_dir}' created or already exists.")
    except OSError as e:
        print(f"Error creating directory '{results_dir}': {e}")
    
    # Create dir "graphs" to save graph .png files
    graphs_dir = './graphs/'
    try:
        os.makedirs(graphs_dir, exist_ok=True)
        if _verbose:
            print(f"Directory '{graphs_dir}' created or already exists.")
    except OSError as e:
        print(f"Error creating directory '{graphs_dir}': {e}")
    
    # define indices
    THRESH = 0
    RATES = 1
    
    # defne date to add as a part of file names
    current_datetime = datetime.now()
    now = datetime.now()
    formatted_date = now.strftime('%Y-%m-%d-%H.%M')
    
    # 1. accuracy, precision vs threshold
    thresholds = []
    accuracies = []
    precisions = []
    for line in specs_on_threshold:
        th = line[THRESH]
        acc = line[RATES]["accuracy"]
        prec = line[RATES]["precision"]
        thresholds.append(th)
        accuracies.append(acc)
        precisions.append(prec)
        
    # graph accuracy, precision vs threshold
    def accuracy_precision_graph(png_file_name):
        """ Make a graph accuracy precision vs threshold """
        plt.title(f"Accuracy, precision vs threshold, model={model_name}, image = ({linear_resolution},{linear_resolution})")
        plt.xlabel("Threshold")
        plt.ylabel("Accuracy, Precision")
        plt.grid()
        plt.plot(thresholds, accuracies, label="Accuracy")
        plt.plot(thresholds, precisions, label="Precision")
        plt.legend()
        plt.savefig(png_file_name, dpi=300, bbox_inches="tight")
        if SHOW_GRAPHS:
            plt.show()
        plt.clf()
        
        
    png_file_name = graphs_dir + formatted_date + "_" + model_name + "_res" + str(linear_resolution) + "_accuracy_precision.png"
    accuracy_precision_graph(png_file_name=png_file_name)
    
    # 2. tpr and fpr vs threshold
    thresholds = []
    true_positive_rates = []
    false_positive_rates = []
    for line in specs_on_threshold:
        # format of the line:
        # line=[threshold, {"true_positive_rate":0.43, "false_positive_rate": 025, ...}
        th = line[THRESH] #threshold
        tpr = line[RATES]["true_positive_rate"]  #tpr
        fpr = line[RATES]["false_positive_rate"] #fpr
        thresholds.append(th)
        true_positive_rates.append(tpr)
        false_positive_rates.append(fpr)
    
    # graph tpr and fpr vs threshold
    def tpr_fpr_graph(png_file_name):
        """ Make a graph tpr and fpr vs threshold """
        plt.title(f"TPR, FPR vs threshold, model={model_name}, image = ({linear_resolution},{linear_resolution})")
        plt.xlabel("Threshold")
        plt.ylabel("TPR, FPR")
        plt.grid()
        plt.plot(thresholds, true_positive_rates, label="True Positive Rate")
        plt.plot(thresholds, false_positive_rates, label="False Positive Rate")
        plt.legend()
        plt.savefig(png_file_name, dpi=300, bbox_inches="tight")
        if SHOW_GRAPHS:
            plt.show()
        plt.clf()
        
    png_file_name = graphs_dir + formatted_date + "_" + model_name + "_res" + str(linear_resolution) + "_tpr_fpr.png"
    tpr_fpr_graph(png_file_name=png_file_name)
    
    # 3. tnr and fnr vs threshold
    thresholds = []
    true_negative_rates = []
    false_negative_rates = []
    for line in specs_on_threshold:
        # format of the line:
        # line=[threshold, {"true_positive_rate":0.43, "false_positive_rate": 025, ...}
        th = line[THRESH]
        tnr = line[RATES]["true_negative_rate"]
        fnr = line[RATES]["false_negative_rate"]
        thresholds.append(th)
        true_negative_rates.append(tnr)
        false_negative_rates.append(fnr)
    
    # graph tnr and fnr vs threshold
    def tnr_fnr_graph(png_file_name):
        """ Make a graph tnr and fnr vs threshold """
        plt.title(f"TNR, FNR vs threshold, model={model_name}, image = ({linear_resolution},{linear_resolution})")
        plt.xlabel("Threshold")
        plt.ylabel("TNR, FNR")
        plt.grid()
        plt.plot(thresholds, true_negative_rates, label="True Negative Rate")
        plt.plot(thresholds, false_negative_rates, label="False Negative Rate")
        plt.legend()
        plt.savefig(png_file_name, dpi=300, bbox_inches="tight")
        if SHOW_GRAPHS:
            plt.show()
        plt.clf()
        
    png_file_name = graphs_dir + formatted_date + "_" + model_name + "_res" + str(linear_resolution) + "_tnr_fnr.png"
    tnr_fnr_graph(png_file_name=png_file_name)
    
    # 4. F1 score
    f1_scores = []
    for i in range(len(true_positive_rates)):
        recall = true_positive_rates[i]
        precision = precisions[i]
        if precision + recall == 0.0:
            f1 = -0.1 # indicator of zero denominator
        else:
            f1 = 2.0 * precision * recall / (precision + recall)
        f1_scores.append(f1)
    
    # graph f1 vs threshold
    def f1_graph(png_file_name):
        """ Make a graph F1 vs threshold """
        plt.title(f"F1 vs threshold, model={model_name}, image = ({linear_resolution},{linear_resolution})")
        plt.xlabel("Threshold")
        plt.ylabel("F1")
        plt.grid()
        plt.plot(thresholds, f1_scores, label="F1")
        plt.legend()
        plt.savefig(png_file_name, dpi=300, bbox_inches="tight")
        if SHOW_GRAPHS:
            plt.show()
        plt.clf()
        
    png_file_name = graphs_dir + formatted_date + "_" + model_name + "_res" + str(linear_resolution) + "_f1.png"
    f1_graph(png_file_name=png_file_name)
        
    # 5. Numbers TP, FP, TN, FN
    true_negatives = []
    false_negatives = []
    true_positives = []
    false_positives = []
    for line in specs_on_threshold:
        # format of the line:
        # line=[threshold, {"true_positive_rate":0.43, "false_positive_rate": 025, ...}
        th = line[THRESH]
        tp = line[RATES]["true_positive"]
        fp = line[RATES]["false_positive"]
        tn = line[RATES]["true_negative"]
        fn = line[RATES]["false_negative"]
        true_positives.append(tp)
        false_positives.append(fp)
        true_negatives.append(tn)
        false_negatives.append(fn)
    
    # Save data to files
    # a. Saving counts vs threshold
    file_name = results_dir + formatted_date + "_" + model_name + "_res" + str(linear_resolution) + "_tp_fp.dat"
    with open(file_name, "w") as file:
        file.write(f"# Model = {model_name}\n")
        file.write(f"# Linear resolution = {linear_resolution}\n")
        file.write("# True positives, false positives, true negatives, false negatives vs threshold:\n")
        file.write("# (1) threshold, (2) TP, (3) FP, (4) TN, (5) FN\n")
        for i in range(len(thresholds)):
            file.write(f"{round(thresholds[i],3)} {true_positives[i]} {false_positives[i]} {true_negatives[i]} {false_negatives[i]}\n")
    print("Model:",model_name,". True positives, false positives, true negatives, false negatives vs threshold saved to file", file_name)
    
    # b. Saving rates vs threshold:
    file_name = results_dir + formatted_date + "_" + model_name +"_res" + str(linear_resolution) + "_rates.dat"
    with open(file_name, "w") as file:
        file.write(f"# Model = {model_name}\n")
        file.write(f"# Linear resolution = {linear_resolution}\n")
        file.write("# Rates vs threshold:\n")
        file.write("# (1) threshold, (2) TPR, (3) FPR, (4) TNR, (5) FNR \n")
        for i in range(len(thresholds)):
            file.write(f"{round(thresholds[i],3)} {true_positive_rates[i]} {false_positive_rates[i]} {true_negative_rates[i]} {false_negative_rates[i]}\n")
    print("Model:",model_name,". Rates vs threshold saved to file", file_name)
    
    # c. Saving accuracy, precision, F1 vs threshold
    file_name = results_dir + formatted_date + "_" + model_name + "_res" + str(linear_resolution) + "_accuracy.dat"
    with open(file_name, "w") as file:
        file.write(f"# Model = {model_name}\n")
        file.write(f"# Linear resolution = {linear_resolution}\n")
        file.write("# Accuracy, precision, F1 vs threshold:\n")
        file.write("# (1) threshold, (2) accuracy, (3) precision, (4) F1\n")
        for i in range(len(thresholds)):
            file.write(f"{round(thresholds[i],3)} {accuracies[i]} {precisions[i]} {f1_scores[i]}\n")
    print("Model:",model_name,". Accuracy, precision, F1 vs threshold saved to file", file_name)
    

def get_model_specs_full_dict(
    weights,
    A,
    B,
    thresholds,
    linear_resolution,
    RESCALE_B,
    RESCALE_PREDICTION
):
    """ Make full dict of specs for the model
    returns spect dict for given picture resolution"""

    # format of the specs dictionary:
    #specs = {"specs_on_threshold":
    #           [
    #               [threshold1, {"true_positive_rate":0.43,...}],
    #               [threshold2, {"true_positive_rate":0.45,...}],
    #               ...
    #           ],
    #         "weight_range": {"w_min": -4.24, "w_max": 3.75}
    #        }
    # set _verbose=True to printout the specs dict to the screen.
    
    
    # init dict and list
    specs = {} #specs dict
    sp_th = [] #specs at given threshold list.
    
    # calculate specs for threshold range:
    for th in thresholds:
        specs_at_th = get_model_specs(
            A=A,
            B=B,
            weights=weights,
            threshold=th,
            linear_resolution=linear_resolution,
            RESCALE_B=RESCALE_B,
            RESCALE_PREDICTION=RESCALE_PREDICTION
        )
        sp_th.append([th, specs_at_th])
        
    # adding specs on threshold to the specs dict
    specs["specs_on_threshold"] = sp_th
    
    # get weight range and set up the dict
    w_min, w_max = get_weights_range(weights=weights)
    specs["weight_range"] = {"w_min": w_min, "w_max": w_max}
    
    #printing the weight range to the screen
    #print(model_name, ": w_min =", round(w_min,2) ,"; w_max =", round(w_max,2))
        
    return specs


def main():
    """ Simple code to test other functions """
    
    #sample specs dict:
    specs = \
        {'specs_on_threshold': [[-1.0,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.9,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.8,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.7,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.6,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.5,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.4,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.30000000000000004,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.19999999999999996,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [-0.09999999999999998,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [0.0,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [0.10000000000000009,
                                 {'accuracy': 0.4375,
                                  'correct': 42,
                                  'false_negative': 0,
                                  'false_negative_rate': 0.0,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 42,
                                  'true_positive_rate': 1.0}],
                                [0.19999999999999996,
                                 {'accuracy': 0.3958333333333333,
                                  'correct': 38,
                                  'false_negative': 4,
                                  'false_negative_rate': 0.09523809523809523,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 38,
                                  'true_positive_rate': 0.9047619047619048}],
                                [0.30000000000000004,
                                 {'accuracy': 0.3958333333333333,
                                  'correct': 38,
                                  'false_negative': 4,
                                  'false_negative_rate': 0.09523809523809523,
                                  'false_positive': 54,
                                  'false_positive_rate': 1.0,
                                  'total': 96,
                                  'true_negative': 0,
                                  'true_negative_rate': 0.0,
                                  'true_positive': 38,
                                  'true_positive_rate': 0.9047619047619048}],
                                [0.3999999999999999,
                                 {'accuracy': 0.4270833333333333,
                                  'correct': 41,
                                  'false_negative': 6,
                                  'false_negative_rate': 0.14285714285714285,
                                  'false_positive': 49,
                                  'false_positive_rate': 0.9074074074074074,
                                  'total': 96,
                                  'true_negative': 5,
                                  'true_negative_rate': 0.09259259259259259,
                                  'true_positive': 36,
                                  'true_positive_rate': 0.8571428571428571}],
                                [0.5,
                                 {'accuracy': 0.5208333333333334,
                                  'correct': 50,
                                  'false_negative': 12,
                                  'false_negative_rate': 0.2857142857142857,
                                  'false_positive': 34,
                                  'false_positive_rate': 0.6296296296296297,
                                  'total': 96,
                                  'true_negative': 20,
                                  'true_negative_rate': 0.37037037037037035,
                                  'true_positive': 30,
                                  'true_positive_rate': 0.7142857142857143}],
                                [0.6000000000000001,
                                 {'accuracy': 0.6458333333333334,
                                  'correct': 62,
                                  'false_negative': 22,
                                  'false_negative_rate': 0.5238095238095238,
                                  'false_positive': 12,
                                  'false_positive_rate': 0.2222222222222222,
                                  'total': 96,
                                  'true_negative': 42,
                                  'true_negative_rate': 0.7777777777777778,
                                  'true_positive': 20,
                                  'true_positive_rate': 0.47619047619047616}],
                                [0.7,
                                 {'accuracy': 0.6041666666666666,
                                  'correct': 58,
                                  'false_negative': 34,
                                  'false_negative_rate': 0.8095238095238095,
                                  'false_positive': 4,
                                  'false_positive_rate': 0.07407407407407407,
                                  'total': 96,
                                  'true_negative': 50,
                                  'true_negative_rate': 0.9259259259259259,
                                  'true_positive': 8,
                                  'true_positive_rate': 0.19047619047619047}],
                                [0.8,
                                 {'accuracy': 0.5729166666666666,
                                  'correct': 55,
                                  'false_negative': 41,
                                  'false_negative_rate': 0.9761904761904762,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 1,
                                  'true_positive_rate': 0.023809523809523808}],
                                [0.8999999999999999,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.0,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.1,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.2000000000000002,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.2999999999999998,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.4,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.5,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.6,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.7000000000000002,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.7999999999999998,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [1.9,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}],
                                [2.0,
                                 {'accuracy': 0.5625,
                                  'correct': 54,
                                  'false_negative': 42,
                                  'false_negative_rate': 1.0,
                                  'false_positive': 0,
                                  'false_positive_rate': 0.0,
                                  'total': 96,
                                  'true_negative': 54,
                                  'true_negative_rate': 1.0,
                                  'true_positive': 0,
                                  'true_positive_rate': 0.0}]],
         'weight_range': {'w_max': 2.5109947065919007, 'w_min': -1.3130265262098624}}
     
    #check make_report function
    make_report(model_name="testModel", linear_resolution=7, specs=specs)
     
    
if __name__ == "__main__":
    main()
