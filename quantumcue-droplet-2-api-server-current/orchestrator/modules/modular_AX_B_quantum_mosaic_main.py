# main file for AX=B

import sys
sys.path.append('./modules')
sys.path.append('./')
import matplotlib.pyplot as plt
#from parameters import *            # get parameters
#from imgs_2_AB_module import *      # get A,B from images
#from predict_module import *
#from mosaic_classical_minimization import *
#from mosaic_quantum_minimization import *
#from model_specs import *
from mosaic_classical_minimization import *
from quantum import *

VERBOSE = False

def do_full_classic_minimization(Q, qci_qbt_num, N_VAR, v, c):
    print("Starting true classical minimization... can be long!", flush=True)
    X1, E1 = make_full_minimization(Q=Q)
    vars_list_full_classical = get_weights_from_QCI_response(
                                Qci_answer_list=X1,
                                N_VAR=N_VAR,
                                v=v,
                                c=c,
                                qci_qbt_num=qci_qbt_num)
    print("Done", flush=True)
    if VERBOSE:
        print("vars_list_full_classical =", vars_list_full_classical,
                "; E =", round(E1,3), flush=True)
    return vars_list_full_classical, E1

def normalize_label(y, linear_resolution):
    """ Modify single label y according to linear resolution
        to keep the weights withing ~ -1...1 range 
    """
    NORMALIZE_ANSWERS = True
    
    if NORMALIZE_ANSWERS:
        f = y * linear_resolution**1.4142135623730951 / 150. #sqrt(2)
        return float(f)
    else:
        return float(y)

def normalize_binary_brain_B(B, linear_resolution):
    """ Scale the labels because in brain we have labels 
        0 for normal and 2 for alzheimer
    """
    # scale label 2 to 1 for alzheimer
    B=B/2
    # scaling the answers to keep weights in range ~ -1...1
    B = [normalize_label(B[i], linear_resolution) for i in range(len(B))]
    return B

def do_mosaic_classic_minimization(Q, num_vars_in_sublist,
                        sublist_overlap, n_iter,
                        N_VAR, v, c, qci_qbt_num):
    print("Starting mosaic classical minimization", flush=True)
    X2, E2 = make_mosaic_minimization(Q=Q,
                        num_vars_in_sublist=num_vars_in_sublist,
                        sublist_overlap=sublist_overlap,
                        n_iter=n_iter)
    
    # get solution for mosaic minimization
    w_mosaic_classic = get_weights_from_QCI_response(
                                Qci_answer_list=X2,
                                N_VAR=N_VAR,
                                v=v,
                                c=c,
                                qci_qbt_num=qci_qbt_num)
                                
    print("Done", flush=True)
    if VERBOSE:
        print("w_mosaic_classic =", w_mosaic_classic, "; E =", round(E2,3))
    return w_mosaic_classic, E2



def do_mosaic_quantum_minimization(Q, num_vars_in_sublist,
                            sublist_overlap, n_iter,
                            QUANTUM_ARCH, num_samples,
                            N_VAR, v, c, qci_qbt_num):
    """
    Make quantum minimization. Returns weights and energy.
    """
    print("Starting mosaic quantum minimization", flush=True)
    print("Architecture QUANTUM_ARCH =", QUANTUM_ARCH)
    
    Xq, Eq = mosaic_quantum_minimization(
                            Q=Q,
                            num_vars_in_sublist=num_vars_in_sublist,
                            sublist_overlap=sublist_overlap,
                            n_iter=n_iter,
                            QUANTUM_ARCH=QUANTUM_ARCH,
                            num_samples=num_samples)

    vars_list_quantum = get_weights_from_QCI_response(
                            Qci_answer_list=Xq,
                            N_VAR=N_VAR,
                            v=v,
                            c=c,
                            qci_qbt_num=qci_qbt_num)
                            
    print("Done")
    if VERBOSE:
        print("vars_list_quantum =", vars_list_quantum, "; E =", round(Eq,3))

    return vars_list_quantum, Eq


def main():

    #1. Read parameters and get A, B
    # read parameters from parameters.py
    parms = get_parms()
    
    train_data_dir = parms['train_data_dir']
    val_data_dir = parms['val_data_dir']
    resolution = parms['resolution']
    N_QUBTS = parms['N_QUBTS']
    shift = parms['shift']
    num_vars_in_sublist = parms['num_vars_in_sublist']
    sublist_overlap = parms['sublist_overlap']
    n_iter = parms['n_iter']
    QUANTUM_ARCH = parms['QUANTUM_ARCH']
    num_samples = parms['num_samples']
    damping = parms['damping']
    
    linear_resolution = resolution[0]
    
    print("\ntraining set data dir =", train_data_dir)
    
    #test A, B; solution of AX=B is x1=1.25, x2=-0.5
    #A = [[3, 2], [1, 1]]
    #B = [2.75, 0.75]
    
    # get A,B from data
    A, B = get_binary_A_B_from_image_dir(train_data_dir, resolution)
    
    #scaling the labels:
    B = normalize_binary_brain_B(B, linear_resolution)

    N_VAR = len(A[0])
    TOTAL_NUM_QUBTS = N_VAR*N_QUBTS
    
    print("Matrix A size =", len(A), "x", len(A[0]))
    print("Vector B length =", len(B))
    print("Total number of qubits =", TOTAL_NUM_QUBTS)
    
    #checks if num_vars_in_sublist <= TOTAL_NUM_QUBTS
    if num_vars_in_sublist > TOTAL_NUM_QUBTS:
            print("*** WARNING:: num_vars_in_sublist =",  num_vars_in_sublist, "is larger than TOTAL_NUM_QUBTS =", TOTAL_NUM_QUBTS)
            print("Setting num_vars_in_sublist =", 
                TOTAL_NUM_QUBTS)
            num_vars_in_sublist = TOTAL_NUM_QUBTS
    
    #2. Get full Q from A, B: 2.a) get Q as a dict from A, B
    Q_dict, v, c = get_Q_dict(A=A,
                            B=B,
                            N_QUBTS=N_QUBTS,
                            shift=shift)
    
    # 2.b) get numpy array Q and qubit mapping for Dirac 1
    Q, qci_qbt_num = Q_dict_2_QCI_np(
                                Q_dict=Q_dict,
                                N_VAR=N_VAR,
                                N_QUBTS=N_QUBTS)
    
    #3. Make minimizations with various methods
    # Choose minimizations techniques:
    DO_FULL_CLASSIC_MINIMIZATION = False
    DO_MOSAIC_CLASSIC_MINIMIZATION = True
    DO_AX_B = True    
    DO_MOSAIC_QUANTUM_MINIMIZATION = False

    # make full classical binary minimization
    if DO_FULL_CLASSIC_MINIMIZATION:
        w_full_classic, E_Full_classic = do_full_classic_minimization(
                                                Q=Q,
                                                qci_qbt_num=qci_qbt_num,
                                                N_VAR=N_VAR,
                                                v=v,
                                                c=c)
                                        
    # make classical mosaic binary minimization
    if DO_MOSAIC_CLASSIC_MINIMIZATION:
        w_mosaic_classic, E_mosaic_classic = do_mosaic_classic_minimization(
                                                Q=Q,
                                                num_vars_in_sublist=num_vars_in_sublist,
                                                sublist_overlap=sublist_overlap,
                                                n_iter=n_iter,
                                                N_VAR=N_VAR,
                                                v=v,
                                                c=c,
                                                qci_qbt_num=qci_qbt_num)
        
    # make quantum mosaic binary minimization
    if DO_MOSAIC_QUANTUM_MINIMIZATION:
        w_mosaic_quantum, E_mosaic_quantum = do_mosaic_quantum_minimization(
                                                Q=Q,
                                                num_vars_in_sublist=num_vars_in_sublist,
                                                sublist_overlap=sublist_overlap,
                                                n_iter=n_iter,
                                                QUANTUM_ARCH=QUANTUM_ARCH,
                                                num_samples=num_samples,
                                                N_VAR=N_VAR,
                                                v=v,
                                                c=c,
                                                qci_qbt_num=qci_qbt_num)
                
    # get matrix solution of AX=B
    if DO_AX_B:
        print("Starting AX=B weight calculation")
        w_AX_B = correctAnswer_np(A, B, damp = damping)
        print("Done")
        
        if VERBOSE:
            #shorter, printable form
            w_tmp = [round(el,3) for el in  w_AX_B]
            print("w_AX_B =", w_tmp)

    # print weight limits:
    print("\nMosaic weight range:")
    print("from", min(w_mosaic_classic), " to", max(w_mosaic_classic))
        
    print("\nAX=B weight range:")
    print("from", min(w_AX_B), " to", max(w_AX_B), "\n")
    
    #####################   VALIDATION ####################
    ### validation on data in 'val_data_dir' #############
    A,B = get_binary_A_B_from_image_dir(val_data_dir, resolution)
    
    #scaling the labels
    B = normalize_binary_brain_B(B, linear_resolution)
    
    #init lists
    accuracies_classical_mosaic = []
    precisions_classical_mosaic = []
    accuracies_AX_B = []
    precisions_AX_B = []
    
    # threshold linspace
    true_thresholds = [0.01*i-1.0 for i in range(500)]
    thresholds = [normalize_label(t, linear_resolution) for t in true_thresholds]
        
    print("Calculating accuracies")
    for threshold in thresholds:
        #getting model specs for all thresholds in the list
        classical_mosaic_specs = get_binary_model_specs(
                                    data_x=A,
                                    data_y=B,
                                    weights=w_mosaic_classic,
                                    threshold=threshold)
                                    
        AX_B_specs = get_binary_model_specs(
                                    data_x=A,
                                    data_y=B,
                                    weights=w_AX_B,
                                    threshold=threshold)
        
        if VERBOSE:
            print("\nFor rescaled threshold =", threshold)
            print("classical_mosaic_specs =", classical_mosaic_specs)
            print("AX=B specs =", AX_B_specs)
        
        accuracies_classical_mosaic.append(classical_mosaic_specs['accuracy'])
        precisions_classical_mosaic.append(classical_mosaic_specs['precision'])
        
        accuracies_AX_B.append(AX_B_specs['accuracy'])
        precisions_AX_B.append(AX_B_specs['precision'])
    print("Done")
     
    #print(AX_B_specs)
    # for the record, the specs dictionary returned by
    # get_binary_model_specs() function is:
    # AX_B_specs = {'true_positive': 0, 'true_negative': 54, 'false_positive': 0, 'false_negative': 42, 'TPR': 0.0, 'FPR': 0.0, 'TNR': 1.0, 'FNR': 1.0, 'accuracy': 0.5625, 'precision': -0.2}
    # Note: -0.2 in the 'precision' is an indicator that the denominator in
    # accuracy definition turned to zero; see the get_binary_model_specs()
    # for more details.
    
    def make_graph():
        """ Make a graph accuracy vs threshold """
        plt.title(f"Accuracy, precisions vs threshold, image = ({linear_resolution},{linear_resolution})")
        plt.xlabel("Threshold")
        plt.ylabel("Accuracy, precision")
        plt.grid()
        # graph for classical mosaic:
        plt.plot(true_thresholds, accuracies_classical_mosaic, label='Accuracy classical mosaic')
        plt.plot(true_thresholds, precisions_classical_mosaic, label='Precision classical mosaic')
        #graph for AX=B model:
        plt.plot(true_thresholds, accuracies_AX_B, label='Accuracy AX=B')
        plt.plot(true_thresholds, precisions_AX_B, label='Precision AX=B')
        #show legend and the graph
        plt.legend()
        plt.show()
    
    #make_graph()
    
    def make_two_graphs():
        """Making graphs accuracy, precision vs threshold
            for classical mosaic and AX=B, on two separate graphs. 
        """
        print("Making graphs")
        fig, axes = plt.subplots(1, 2, figsize=(10, 4))
        
        #axes[0].plot(x1, y1, color='blue')
        axes[0].plot(true_thresholds, accuracies_classical_mosaic, label='Accuracy classical mosaic')
        axes[0].plot(true_thresholds, precisions_classical_mosaic, label='Precision classical mosaic')
        axes[0].set_title(f'Classical Mosaic, image = ({linear_resolution},{linear_resolution})')
        axes[0].set_xlabel('Threshold')
        axes[0].set_ylabel('Accuracy, Precision')
        axes[0].grid(True)
        axes[0].legend()
        
        axes[1].plot(true_thresholds, accuracies_AX_B, label='Accuracy AX=B')
        axes[1].plot(true_thresholds, precisions_AX_B, label='Precision AX=B')
        axes[1].set_title(f'AX=B, image = ({linear_resolution},{linear_resolution})')
        axes[1].set_xlabel('Threshold')
        axes[1].set_ylabel('Accuracy, Precision')
        axes[1].grid(True)
        axes[1].legend()
        
        plt.tight_layout()
        plt.show()
        
    make_two_graphs()
    
if __name__ == "__main__":
    main()
