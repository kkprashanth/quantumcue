# Predict module plus main() for testing

VERSION = '2025-11-29'

#READ_QCI_RESULTS_FROM_DATAFILE = False

# importing
import time
#print("Loading libraries...", end='', flush=True); tstart = time.time()
import os; os.environ['TF_CPP_MIN_LOG_LEVEL'] = '1'
#import torch
import numpy as np
import json
import sys
#import mosaic_classical_minimization as mosaic

# cache
from joblib import Memory
memory_quantum = Memory("/tmp/cache_quantum", verbose=0)

PRINT_RESULT = False
VERBOSE = False
_verbose = VERBOSE
    
########## functions ##########

def num_2_qbt_name (var = 0, qnum = 0):
    '''
        Define qubit name from the variable name and
        the number of qubit for this variable. Returns string with the qubit name.
        Usage example:
          num_2_qbt_name (var = 231, qnum = 56)
          returns string 0231_0056
        Parameter n_max is how many digits are reserved for
        variable and qubit numbering
    '''
    n_max = 4

    var_str = str(var)
    qbt_str = str(qnum)

    if (len(var_str) > n_max) or (len(qbt_str) > n_max):
        print("*** Too many variables or qubits requested, can't assign string")
        print("increase n_max, now n_max = ", n_max)
        quit()

    z=''
    for i in range(n_max - len(var_str)):
        z += '0'
    var_str = z + var_str

    z=''
    for i in range(n_max - len(qbt_str)):
        z += '0'
    qbt_str = z + qbt_str
    
    return var_str + '_' + qbt_str

def qbt_name_2_num(qubit_name):
    '''
        Parse qubit name from the Q dictionary and return
        the var and qubit numbers.
        Usage example
          var, qnum = qbt_name_2_num('0754_0021')
        returns var=754 and qnum=21.
        n_max is the num of digist reserved for the var and qubit
        offset reserves space for the underscore "_" in the qubit name
    '''

    n_max = 4
    offset = 1
    
    var_str = qubit_name[0:n_max]
    var = int(var_str)
    
    qbt_str = qubit_name[n_max+offset:]
    qbt = int(qbt_str)
    
    return var, qbt


def calcQLinCp(A,R,N,M):
    ''' Defines the compoment for the dictionary calculation
    Usage: setQdict(A,R,N,M)
    where   A - equation matrix array
            R - the r.h.s vector in equations
            N - number of equations
            M - number of variables
    Returns: two numpy arrays: vector Qlin for linear part of Q
            and 2d array Qcross for quadratic cross-product part of Q'''
    
#   linear part
    Qlin = np.zeros(M)
    for i in range(M):
        for k in range(N):
            Qlin[i] += - 2.0 * R[k] * A[k][i]
        
#   cross-products
    Qcross = np.zeros((M,M))
    for i in range(M):
        for j in range(M):
            for k in range(N):
                Qcross[i][j] += 2.0 * A[k][i] * A[k][j]
    return Qlin, Qcross

def calcQdueToC(A, R, N_EQS, N_VAR, N_QUBTS, v, c):
    ''' Calculate Q due to c, which is the shift to the negative domain.
        Here:
            A - equation matrix array
            R - the r.h.s vector in equations
            N_EQS - number of equations
            N_VAR - number of variables
            N_QUBTS - number of qubits
    '''
    
    QdueToC = np.zeros((N_VAR,N_QUBTS))

    for j in range(N_VAR):
        sum = 0.0
        for i in range(N_EQS):
            sum_j1 = 0.0
            for j1 in range(N_VAR):
                sum_j1 += A[i][j1]
            sum += A[i][j] * sum_j1
        for k in range(N_QUBTS):
            QdueToC[j][k] = -2.0 * c * v[k] * sum
    return QdueToC


def setQdictWithC(Qlin, Qcp, QdueToC, v, N_VAR, N_QUBTS):
    ''' Defines the disctionary for D-Wave
    Usage: setQdict()
    Returns: dictionary'''
    
    #global Q_matrix, Q_vec
    Q_vec = [] ###@
    Q_matrix = [] ###@
    
    Q={}
    eps = 0.0000001
#   linear part
    for var in range(N_VAR):
        for qnum in range(N_QUBTS):
            #q = 'q_' + str(var) + '_' + str(qnum)
            q = num_2_qbt_name (var, qnum)
            Q[(q,q)] = v[qnum] * Qlin[var] + 0.5 * v[qnum]**2 * Qcp[var][var] \
                     + QdueToC[var][qnum]
            if Q[(q,q)]*Q[(q,q)] > eps :
                Q_vec.append([var*N_QUBTS+qnum, Q[(q,q)]])
    
#   cross-product
    for var1 in range(N_VAR):
        for var2 in range(N_VAR):
            for qnum2 in range(N_QUBTS-1):
                for qnum1 in range(qnum2+1, N_QUBTS):
                    #q = 'q_' + str(var1) + '_' + str(qnum1)
                    #p = 'q_' + str(var2) + '_' + str(qnum2)
                    q = num_2_qbt_name (var1, qnum1)
                    p = num_2_qbt_name (var2, qnum2)
                    Q[(q,p)] = v[qnum1] * v[qnum2] * Qcp[var1][var2]
                    if Q[(q,p)]*Q[(q,p)] > eps :
                        Q_matrix.append([var1*N_QUBTS+qnum1, var2*N_QUBTS+qnum2, Q[(q,p)]])

#   same qubit positions
    for var1 in range(N_VAR-1):
        for var2 in range(var1+1, N_VAR):
            for qnum in range(N_QUBTS):
                #q = 'q_' + str(var1) + '_' + str(qnum)
                #p = 'q_' + str(var2) + '_' + str(qnum)
                q = num_2_qbt_name (var1, qnum)
                p = num_2_qbt_name (var2, qnum)
                Q[(q,p)] = v[qnum] * v[qnum] * Qcp[var1][var2]
                if Q[(q,p)]*Q[(q,p)] > eps :
                    Q_matrix.append([var1*N_QUBTS+qnum, var2*N_QUBTS+qnum, Q[(q,p)]])
           
    return Q


def readFile(fname):
    '''Reads file to input the equation matrix'''
    data1 = np.genfromtxt(fname)
    return data1
 
def matrixSize(m):
    ''' Determines matrix size for the equation matrix.
        Usage: matrixSize(m)
            m - equation matrix
        Returns N - number of equations (=number of lines) and M - number of variables (=number of columns)'''
    N = len(m)
    M = len(m[0])
    return N, M

#def correctAnswer(A, R, damp = 0.):
#    AT = torch.tensor(A)
#    BT = torch.t(torch.tensor(R))
#    AT_t = torch.t(AT)
#    dampIdent = damp * torch.eye(len(AT[0]),len(AT[0]))
#    
#    ans = torch.matmul( torch.matmul( torch.linalg.inv( \
#                  torch.matmul(AT_t, AT) + dampIdent), \
#                  AT_t), BT)
#    return ans.tolist()

@memory_quantum.cache
def correctAnswer_np(A, B, damp = 0.1):
    AT = np.array(A, dtype='f')
    B = np.array(B, dtype='f')
    BT = np.transpose(B)
    AT_t = np.transpose(AT)
    dampIdent = damp * np.eye(len(AT[0]),len(AT[0]))
    
    ans = np.matmul( np.matmul( np.linalg.inv( \
                  np.matmul(AT_t, AT) + dampIdent), \
                  AT_t), BT)
    return ans.tolist()

@memory_quantum.cache
def get_Q_dict(A, B, N_QUBTS, shift, quantum_flags):

    v = [2**(i-shift) for i in range(N_QUBTS)]
    
    c = int(0.5 * sum(v))+1.0
    #c = 0 #OUR TEST!!
    #c = 0.5 * (sum(v)+1) # maybe this one works? Yura suggestion
    print("\n*** WARNING!!! get_Q_dict:: FIX C around line 224 in quantum.py module !!!")
    print("    Quick fix now is: c = int(0.5 * sum(v))+1\n")
    
    #c=1.0
    #print(f"\n\n*** WARNING: MANUAL C={c}\nFIX ON LINE 219 of predict_module\n")
    #v = [0.125, 0.25, 0.5, 1.] #factors at qubits

    N_EQS, N_VAR = matrixSize(A) #N_EQS equations, N_VAR variables

    #   check consistency
    if N_EQS != len(B) :
        print('*** Sizes of matrix and rhs do not match. Quit now')
        quit()

    print("N_QUBTS =", N_QUBTS, " per variable")
    print("shift =", shift)
    print("c =", c, ", v =", v)
    print("Dynamic range for weights =", -c, "...", sum(v)-c)
    print("Total number of qubits =", N_QUBTS*N_VAR)
    #print('A, R =')
    #print(A)
    #print(R)

    if not quantum_flags['READ_QCI_RESULTS_FROM_DATAFILE']:
        #   calculate Q components, setup the dictionary Q
        print("\nCalculating Q ...", end='', flush=True)
        #tstart = time.time()
        Qlin, Qcp = calcQLinCp(A, B, N_EQS, N_VAR)
        QdueToC = calcQdueToC(A, B, N_EQS, N_VAR, N_QUBTS, v, c)
        Q = setQdictWithC(Qlin, Qcp, QdueToC, v, N_VAR, N_QUBTS)
        #printQ(Q)

        #removing zero elements from Q
        Qout={}
        for k in Q.keys():
            if Q[k]**2 > 0.00000001:
                Qout[k] = Q[k]
        
        print("done.")
    else:
        # just make an empty Q since the
        # data are read from a pre-computer json file later
        Qout = {}
        print("*** WARNING :: get_dict_Q :: making empty Q - expect to read QCI  results from a file.")
    
    return Qout, v, c
    
def get_diagonal_Q_dict(A, B, N_QUBTS, shift):
    """ ONLY GET diagonal terms in Q"""
    print("\n*** WARNING:: get_diagonal_Q_dict:: Calculating only diagonal terms in Q.\n")

    v = [2**(i-shift) for i in range(N_QUBTS)]
    
    c = int(0.5 * sum(v))+1.0
    #c = 2
    #c = 0.5 * (sum(v)+1) # maybe this one works? Yura suggestion
    print("\n*** WARNING:: get_diagonal_Q_dict:: FIX C around line 217 in quantum.py module !!!")
    print("    Quick fix now is: c = int(0.5 * sum(v))+1\n")
    
    #c=1.0
    #print(f"\n\n*** WARNING: MANUAL C={c}\nFIX ON LINE 219 of predict_module\n")
    #v = [0.125, 0.25, 0.5, 1.] #factors at qubits

    N_EQS, N_VAR = matrixSize(A) #N_EQS equations, N_VAR variables

    #   check consistency
    if N_EQS != len(B) :
        print('*** Sizes of matrix and rhs do not match. Quit now')
        quit()

    print("N_QUBTS =", N_QUBTS, " per variable")
    print("shift =", shift)
    print("c =", c, ", v =", v)
    print("Dynamic range for weights =", -c, "...", sum(v)-c)
    print("Total number of qubits =", N_QUBTS*N_VAR)
    #print('A, R =')
    #print(A)
    #print(R)

    #   calculate Q components, setup the dictionary Q
    print("\nCalculating DIAGONAL Q ...", end='', flush=True)
    #tstart = time.time()
    Qlin, Qcp = calcQLinCp(A, B, N_EQS, N_VAR)
    QdueToC = calcQdueToC(A, B, N_EQS, N_VAR, N_QUBTS, v, c)
    Q = setQdictWithC(Qlin, Qcp, QdueToC, v, N_VAR, N_QUBTS)
    #printQ(Q)

    #removing zero elements from Q
    #Qout={}
    #for k in Q.keys():
    #    if Q[k]**2 > 0.00000001:
    #        Qout[k] = Q[k]

    # get only diagonsl elements of Q
    Q_diag = {}
    for k in Q.keys():
        k1, k2 = k
        print(f"k={k}, k1={k1}, k2={k2}")
        if k1 == k2:
            # write diagonal element to Q_diag
            Q_diag[k] = Q[k]
            print(f"Q_diag[{k}] =", Q_diag[k])
    
    #print
    import pprint
    print("Q_diag =")
    pprint.pprint(Q_diag)
    #Qout=Q
    
    return Q_diag, v, c

@memory_quantum.cache
def Q_dict_2_QCI_np(Q_dict, N_VAR, N_QUBTS):
    ### Q to QCI here ######################################

    # Creating numpy matrix for QCI from the Qout dictionary ##########
    Q_qci = np.zeros(N_VAR*N_VAR*N_QUBTS*N_QUBTS).reshape(N_VAR*N_QUBTS,N_VAR*N_QUBTS)
    print("Q_qci created, shape =", Q_qci.shape)

    # Making numpy matrix for QCI
    for k in Q_dict.keys():
        val = Q_dict[k]
        (k1, k2) = k
        var1, qnum1 = qbt_name_2_num(k1)
        var2, qnum2 = qbt_name_2_num(k2)
        i = var1 * N_QUBTS + qnum1 #qci qubit number 1
        j = var2 * N_QUBTS + qnum2 #qci qubit number 2
        if i == j:
            Q_qci[i][j] = val
        else:
            Q_qci[i][j] = Q_qci[j][i] = 0.5 * val
        if _verbose:
            print("k =", k, ", k1 =", k1, ", k2 =", k2, ", val =", val)
            print("  var1 =", var1, ", qnum1 =", qnum1, ", var2 =", var2, ", qnum2 =", qnum2)
            print("  i =", i, ", j =", j)

    if _verbose:
        print("Q_qci =")
        print(Q_qci)

    # writing a dictionary (qci qubit number) => (variable and qubit number)
    # restore var and qubit from qci qubit number:
    #     (var, qnum) = qci_qbt_num[str(i)]
    # where var, qnum are the variable and qubit number in regular numbering scheme,
    # and i is the qci qubit number
    # for example, if 52th qci qubit corresponds var=5, qnum=4 then
    #     i = 52 #qci qubit number
    #     (var, qnum) = qci_qbt_num[str(i)]
    # returns (var, qnum) = (5,4)
    qci_qbt_num = {}
    for var in range(N_VAR):
        for qnum in range(N_QUBTS):
            i = var * N_QUBTS + qnum #qci qubit number
            qci_qbt_num[str(i)] = (var, qnum)
            
    if _verbose:
        print(qci_qbt_num)

    return Q_qci, qci_qbt_num


def minimize_QCI_Dirac1(Q_np):
    """
    Example of input:
    {'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}}
    
    Example of ourput:
    {'job_info': {'job_id': '686c59e832604586ad9080c1', 'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-07T23:36:08.562Z', 'queued_at_rfc3339nano': '2025-07-07T23:36:08.563Z', 'running_at_rfc3339nano': '2025-07-07T23:36:08.726Z', 'completed_at_rfc3339nano': '2025-07-07T23:37:13.699Z'}, 'job_result': {'file_id': '686c5a29acc178773e9913d2', 'device_usage_s': 2}}, 'status': 'COMPLETED', 'results': {'counts': [5], 'energies': [-67.625], 'solutions': [[1, 0, 0, 1, 0, 1, 0, 0]]}}
    """
    from qci_client import JobStatus, QciClient
    import numpy as np
    
    url = "https://api.qci-prod.com"
    api_token = "0e0dfe7fe8b4fab10f8e3b58101f27ac"
    qclient = QciClient(url=url, api_token=api_token)

    qubo_data = {
        'file_name': "dirac_1_qubo",
        'file_config': {'qubo':{"data": Q_np}}
    }

    response_json = qclient.upload_file(file=qubo_data)
    
    num_samples = 5
    
    job_body = qclient.build_job_body(
        job_type="sample-qubo",
        qubo_file_id=response_json['file_id'],
        job_params={"device_type": "dirac-1", "num_samples": num_samples})

    if _verbose:
        print(job_body)

    job_response = qclient.process_job(job_body=job_body)
    
    #job_response =   {'job_info': {'job_id': '686c59e832604586ad9080c1', 'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-07T23:36:08.562Z', 'queued_at_rfc3339nano': '2025-07-07T23:36:08.563Z', 'running_at_rfc3339nano': '2025-07-07T23:36:08.726Z', 'completed_at_rfc3339nano': '2025-07-07T23:37:13.699Z'}, 'job_result': {'file_id': '686c5a29acc178773e9913d2', 'device_usage_s': 2}}, 'status': 'COMPLETED', 'results': {'counts': [5], 'energies': [-67.625], 'solutions': [[1, 0, 0, 1, 0, 1, 0, 0]]}}
    if _verbose:
        print(job_response)

    assert job_response["status"] == JobStatus.COMPLETED.value
    
    energy_list = job_response['results']['energies']
    energy_counts = response['results']['counts']
    
    # taking the sample with the minimal energy
    min_en = min(energy_list)                       #minimum energy, e.g. [-67.5625]
    min_idx = energy_list.index(min_en)        #index of min energy, e.g., 0
    print("DIRAC-1 response: energy_list = ", energy_list)
    print("Energy counts =", energy_counts)
    solution = job_response['results']['solutions'][min_idx] # e.g.,  [[1, 0, 0, 1, 0, 1, 0, 0]]
    #print("solution =", solution)
    print("min_en =", min_en)
    
    return solution
    
def minimize_QCI_Dirac1_Ex(Q_np, num_samples):
    """
    Ex-version for quantum server 2026: returns x, E.
    
    Example of input:
    {'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}}
    
    Example of ourput:
    {'job_info': {'job_id': '686c59e832604586ad9080c1', 'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-07T23:36:08.562Z', 'queued_at_rfc3339nano': '2025-07-07T23:36:08.563Z', 'running_at_rfc3339nano': '2025-07-07T23:36:08.726Z', 'completed_at_rfc3339nano': '2025-07-07T23:37:13.699Z'}, 'job_result': {'file_id': '686c5a29acc178773e9913d2', 'device_usage_s': 2}}, 'status': 'COMPLETED', 'results': {'counts': [5], 'energies': [-67.625], 'solutions': [[1, 0, 0, 1, 0, 1, 0, 0]]}}
    """
    from qci_client import JobStatus, QciClient
    import numpy as np
    
    # either submit job to QCI or read results from data file

    # process with QCI computer
    print("*** INFO :: minimize_QCI_Dirac1_E :: sending job to DIRAC-1")
    url = "https://api.qci-prod.com"
    api_token = "0e0dfe7fe8b4fab10f8e3b58101f27ac"
    qclient = QciClient(url=url, api_token=api_token)

    qubo_data = {
        'file_name': "dirac_1_qubo",
        'file_config': {'qubo':{"data": Q_np}}
    }

    response_json = qclient.upload_file(file=qubo_data)
        
    job_body = qclient.build_job_body(
        job_type="sample-qubo",
        qubo_file_id=response_json['file_id'],
        job_params={"device_type": "dirac-1",
            "num_samples": num_samples})
            
    if _verbose:
        print(job_body)

    # Get QCI reponse:
    job_response = qclient.process_job(job_body=job_body)
    assert job_response["status"] == JobStatus.COMPLETED.value
    
    if _verbose:
        print(job_response)
    
    # Test response
    #job_response =   {'job_info': {'job_id': '686c59e832604586ad9080c1', 'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-07T23:36:08.562Z', 'queued_at_rfc3339nano': '2025-07-07T23:36:08.563Z', 'running_at_rfc3339nano': '2025-07-07T23:36:08.726Z', 'completed_at_rfc3339nano': '2025-07-07T23:37:13.699Z'}, 'job_result': {'file_id': '686c5a29acc178773e9913d2', 'device_usage_s': 2}}, 'status': 'COMPLETED', 'results': {'counts': [5], 'energies': [-67.625], 'solutions': [[1, 0, 0, 1, 0, 1, 0, 0]]}}
    #print("*** WARNING :: minimize_QCI_Dirac1_E :: Line 481 - getting test response for debugging, not QCI")
    
    energy_list = job_response['results']['energies']
    
    # taking the sample with the minimal energy
    min_en = min(energy_list)                       #minimum energy, e.g. [-67.5625]
    min_idx = energy_list.index(min_en)        #index of min energy, e.g., 0
    
    print("DIRAC-1 response: energy_list = ", energy_list)
    print("counts =", job_response['results']['counts'])
    print("min_en =", min_en)
    print("Minimal energy index =", min_idx)
    
    # which nergy index to take. Experimental parameter
    energy_deviation = 0 # which energy index to take. 0 means lowest energy, 1 means the next above the lowest energy, etc
    energy_idx = min_idx + energy_deviation
    print("Taking solution for energy index =", energy_idx)
    #solution = job_response['results']['solutions'][min_idx] # e.g.,  [[1, 0, 0, 1, 0, 1, 0, 0]]
    solution = job_response['results']['solutions'][energy_idx]
    
    return solution, energy_list[energy_idx]



def minimize_QCI_Dirac1_E(Q_np, num_samples, quantum_flags):
    """
    E-version: returns x, E.
    
    Example of input:
    {'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}}
    
    Example of ourput:
    {'job_info': {'job_id': '686c59e832604586ad9080c1', 'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-07T23:36:08.562Z', 'queued_at_rfc3339nano': '2025-07-07T23:36:08.563Z', 'running_at_rfc3339nano': '2025-07-07T23:36:08.726Z', 'completed_at_rfc3339nano': '2025-07-07T23:37:13.699Z'}, 'job_result': {'file_id': '686c5a29acc178773e9913d2', 'device_usage_s': 2}}, 'status': 'COMPLETED', 'results': {'counts': [5], 'energies': [-67.625], 'solutions': [[1, 0, 0, 1, 0, 1, 0, 0]]}}
    """
    from qci_client import JobStatus, QciClient
    import numpy as np
    
    # either submit job to QCI or read results from data file
    if not quantum_flags['READ_QCI_RESULTS_FROM_DATAFILE'] :
        # process with QCI computer
        print("*** INFO :: minimize_QCI_Dirac1_E :: sending job to DIRAC-1")
        url = "https://api.qci-prod.com"
        api_token = "0e0dfe7fe8b4fab10f8e3b58101f27ac"
        qclient = QciClient(url=url, api_token=api_token)

        qubo_data = {
            'file_name': "dirac_1_qubo",
            'file_config': {'qubo':{"data": Q_np}}
        }

        response_json = qclient.upload_file(file=qubo_data)
            
        job_body = qclient.build_job_body(
            job_type="sample-qubo",
            qubo_file_id=response_json['file_id'],
            job_params={"device_type": "dirac-1",
                "num_samples": num_samples})
                
        if _verbose:
            print(job_body)

        # Get QCI reponse:
        job_response = qclient.process_job(job_body=job_body)
        assert job_response["status"] == JobStatus.COMPLETED.value
        
        if _verbose:
            print(job_response)
        
        # Test response
        #job_response =   {'job_info': {'job_id': '686c59e832604586ad9080c1', 'job_submission': {'problem_config': {'quadratic_unconstrained_binary_optimization': {'qubo_file_id': '686c59e8acc178773e9913d0'}}, 'device_config': {'dirac-1': {'num_samples': 5}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-07T23:36:08.562Z', 'queued_at_rfc3339nano': '2025-07-07T23:36:08.563Z', 'running_at_rfc3339nano': '2025-07-07T23:36:08.726Z', 'completed_at_rfc3339nano': '2025-07-07T23:37:13.699Z'}, 'job_result': {'file_id': '686c5a29acc178773e9913d2', 'device_usage_s': 2}}, 'status': 'COMPLETED', 'results': {'counts': [5], 'energies': [-67.625], 'solutions': [[1, 0, 0, 1, 0, 1, 0, 0]]}}
        #print("*** WARNING :: minimize_QCI_Dirac1_E :: Line 481 - getting test response for debugging, not QCI")
        
        # saving response file
        from datetime import datetime
        current_datetime = datetime.now()
        timestamp = current_datetime.strftime('%Y-%m-%d-%H.%M')

        model_dir = 'saved_models/'

        path_to_response = model_dir + timestamp + '-response-dirac1.json'
        try:
            with open(path_to_response, 'w') as f:
                json.dump(job_response, f, indent=4)
            print(f"minimize_QCI_Dirac1_E :: QCI response saved to {path_to_response}")
        except Exception as e:
            print(f"minimize_QCI_Dirac1_E :: Can't save response to file. Error: {e}")

    else:
        # Read results in job_response from a file
        print("*** INFO :: minimize_QCI_Dirac1_E :: results are read from json file")
        file_path = quantum_flags['SAVED_DATA_FILENAME']  # or 'saved_data/results.json'

        try:
            with open(file_path, 'r') as file:
                job_response = json.load(file)  # Proper json module usage
            print("JSON data loaded successfully")
            print(job_response)
        except FileNotFoundError:
            print(f"Error: The file '{file_path}' was not found.")
            quit()
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from '{file_path}'. Check file format.")
            quit()
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            quit()
        
    energy_list = job_response['results']['energies']
    
    # taking the sample with the minimal energy
    min_en = min(energy_list)                       #minimum energy, e.g. [-67.5625]
    min_idx = energy_list.index(min_en)        #index of min energy, e.g., 0
    
    print("DIRAC-1 response: energy_list = ", energy_list)
    print("counts =", job_response['results']['counts'])
    print("min_en =", min_en)
    print("Minimal energy index =", min_idx)
    
    # which nergy index to take
    energy_deviation = 0 # which energy index to take. 0 means lowest energy, 1 means the next above the lowest energy, etc
    energy_idx = min_idx + energy_deviation
    print("Taking solution for energy index =", energy_idx)
    #solution = job_response['results']['solutions'][min_idx] # e.g.,  [[1, 0, 0, 1, 0, 1, 0, 0]]
    solution = job_response['results']['solutions'][energy_idx]
    
    return solution, energy_list[energy_idx]

    #return solution, min_en


def minimize_QCI_Dirac3(Q_np):

    # rewriting data fpr QCI in a new format data list from numpy array for QCI Dirac 3.
    # Example fo the data in the polynomial format:
    # data_QCI =
        # [{'idx': [0, 1], 'val': -12.375},
        # {'idx': [0, 2], 'val': -23.5},
        # {'idx': [0, 3], 'val': -42.0},
        # ...
        # {'idx': [6, 7], 'val': 5.0},
        # {'idx': [6, 8], 'val': 10.0},
        # {'idx': [7, 8], 'val': 20.0}]
 
    # Total number of Qubits in the system:
    #TOTAL_N_QUBTS = N_QUBTS*N_VAR
    TOTAL_N_QUBTS = len(Q_np)
    
    # numpy array with the Q from the function input (just dummy redifinition)
    Q_qci = Q_np
    
    # creating an empy list to populate with Q in the polynomial format.
    data_QCI = []
    
    # setting up all levels =2 (two-level qubits)
    level_num = 2 #qubits
    levels = [level_num for i in range(TOTAL_N_QUBTS)]
    
    # IMPORTANT: device limit 954 qubits for (N of qubits)*(N of levels)
    qubit_hardware_limit_Dirac3 = 954
    if TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3:
        print("*** ERROR: TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3 = 954.")
        print("*** Reduce the number of qubits per variables, N_QUBTS, or number of variables, N_VAR. Stop now")
        abort()
    else:
        print("Number of Dirac3 levels used:", TOTAL_N_QUBTS * level_num, "out of", qubit_hardware_limit_Dirac3)
    
    #diagonal elements in data_QCI
    for i in range(TOTAL_N_QUBTS):
        #print("Q_qci[", i, ",", i,"]=", Q_qci[i,i])
        val = Q_qci[i,i]
        idx = [0, i+1]
        elem = {'idx': idx, 'val': val}
        data_QCI.append(elem)
        
    #off-diag elements in data_QCI:
    for i in range(0,TOTAL_N_QUBTS-1):
        for j in range(i+1, TOTAL_N_QUBTS):
            idx = [i+1, j+1]
            val = Q_qci[i,j] * 2.0
            elem = {'idx': idx, 'val': val}
            data_QCI.append(elem)

    #printing
    if _verbose:
        import pprint
        print("data_QCI =")
        pprint.pprint(data_QCI)

    # preparing the request for QCI Dirac 3.
    from qci_client import JobStatus, QciClient
    from pprint import pprint
    url = "https://api.qci-prod.com"
    api_token = "0e0dfe7fe8b4fab10f8e3b58101f27ac"
    client = QciClient(url=url, api_token=api_token)

    # defining the  problem file
    file_int_problem = {
        "file_name": "dirac_3_integer_example",
        "file_config": {
            "polynomial": {
                "num_variables": TOTAL_N_QUBTS,  #SET THIS!
                "min_degree": 1,     #SET THIS!
                "max_degree": 2,     #SET THIS!
                "data": data_QCI
            }
        }
    }
    # sending the problem file to QCI computer and get file ID
    file_response_int_problem = client.upload_file(file=file_int_problem)
    
    # Relaxation parameters
    num_samples = 5             #how many samples to run
    relaxation_schedule = 1     #can be 1,2,3 ...see the manual
    
    job_body_int_problem = client.build_job_body(
        job_type='sample-hamiltonian-integer',
        job_name='test_integer_variable_hamiltonian_job', # user-defined string, optional
        job_tags=['tag1', 'tag2'],  # user-defined list of string identifiers, optional
        job_params={
            'device_type': 'dirac-3',
            'num_samples': num_samples,
            'relaxation_schedule': relaxation_schedule,
            'num_levels': levels, #Example: [2,2,2] for 3 qubits
        },
        polynomial_file_id=file_response_int_problem['file_id'],
    )
    
    if _verbose:
        print(file_response_int_problem)
        print(job_body_int_problem)
    #quit()
    
    job_response_int_problem = client.process_job(job_body=job_body_int_problem)
    assert job_response_int_problem["status"] == JobStatus.COMPLETED.value
    
    # sample Dirac3 response =
    #job_response_int_problem = {'job_info': {'job_id': '686344445e5ac839b11f2aa4', 'job_submission': {'job_name': 'test_integer_variable_hamiltonian_job', 'job_tags': ['tag1', 'tag2'], 'problem_config': {'qudit_hamiltonian_optimization': {'polynomial_file_id': '686344435e085526322aa485'}}, 'device_config': {'dirac-3_qudit': {'num_levels': [2, 2, 2, 2, 2, 2, 2, 2], 'num_samples': 5, 'relaxation_schedule': 1}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-01T02:13:24.395Z', 'queued_at_rfc3339nano': '2025-07-01T02:13:24.396Z', 'running_at_rfc3339nano': '2025-07-01T02:14:22.181Z', 'completed_at_rfc3339nano': '2025-07-01T02:14:34.283Z'}, 'job_result': {'file_id': '6863448a5e085526322aa48b', 'device_usage_s': 7}}, 'status': 'COMPLETED', 'results': {'counts': [3, 1, 1], 'energies': [-67.5625, -67.375, -67.3125], 'solutions': [[1, 1, 1, 0, 1, 0, 1, 0], [1, 0, 1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1, 1, 0]]}}
    
    print("DIRAC-3: energies:")
    print(job_response_int_problem['results']['energies'])
    print("counts:")
    print(job_response_int_problem['results']['counts'])
    
    if _verbose:
        print("Full QCI response =")
        print(job_response_int_problem)
        
    # taking min energy solution
    energy_list = job_response_int_problem['results']['energies']   #example: [-67.5625, -67.375, -67.3125]
    min_en = min(energy_list)                       #minimum energy, e.g. -67.5625
    min_idx = energy_list.index(min_en)             #index of min energy, e.g., 0
    Qci_answer_list = job_response_int_problem['results']['solutions'][min_idx] #qubit solution for min energy, e.g. [1, 1, 1, 0, 1, 0, 1, 0]
    
    #Qci_answer_list = job_response_int_problem['results']['solutions'][0]
    #print("Qci_answer_list =", Qci_answer_list)

    #saving answer list
    SAVE_THIS = False
    if SAVE_THIS:
        with open('Qci_answer_list.json', 'w') as file:
            json.dump(Qci_answer_list, file)
        print("\nThe minimum-energy qubit list written to file Qci_answer_list.json")

    return Qci_answer_list


def convert_dirac1_to_dirac3_fmt(Q_qci, num_levels):
    """ Take Dirac-1 numpy array and convert to Dirac-3 polynomial format """
    # Define total number of qubits used
    TOTAL_N_QUBTS = len(Q_qci)
    
    # Create an empy list to populate with Q in the polynomial format.
    data_QCI = []
    
    # Set levels
    levels = [num_levels for i in range(TOTAL_N_QUBTS)]
    
    # Check num of levels used. 
    # IMPORTANT: device limit 954 qubits for (N of qubits)*(N of levels)
    qubit_hardware_limit_Dirac3 = 954
    
    if TOTAL_N_QUBTS * num_levels > qubit_hardware_limit_Dirac3:
        print("*** ERROR: TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3 = 954.")
        print("*** Reduce the number of qubits per variables, N_QUBTS, or number of variables, N_VAR. Stop now")
        abort()
    else:
        print("Number of Dirac3 levels used:", TOTAL_N_QUBTS * num_levels, "out of", qubit_hardware_limit_Dirac3)
    
    # Convert numpy to polynomial form
    # 1) Diagonal elements in data_QCI
    for i in range(TOTAL_N_QUBTS):
        val = float(Q_qci[i,i])
        idx = [0, i+1]
        elem = {'idx': idx, 'val': val}
        data_QCI.append(elem)
        
    # 2) Off-diag elements in data_QCI:
    for i in range(0,TOTAL_N_QUBTS-1):
        for j in range(i+1, TOTAL_N_QUBTS):
            idx = [i+1, j+1]
            val = float(Q_qci[i,j] * 2.0)
            elem = {'idx': idx, 'val': val}
            data_QCI.append(elem)
    
    return data_QCI

def minimize_QCI_Dirac3_Ex(data_QCI, num_samples, num_levels, relaxation_schedule, total_num_qubits):

    # rewriting data for QCI in a new format data list from numpy array for QCI Dirac 3.
    # Example fo the data in the polynomial format:
    # data_QCI =
        # [{'idx': [0, 1], 'val': -12.375},
        # {'idx': [0, 2], 'val': -23.5},
        # {'idx': [0, 3], 'val': -42.0},
        # ...
        # {'idx': [6, 7], 'val': 5.0},
        # {'idx': [6, 8], 'val': 10.0},
        # {'idx': [7, 8], 'val': 20.0}]
 
    # Total number of Qubits in the system:
    #TOTAL_N_QUBTS = N_QUBTS*N_VAR
    TOTAL_N_QUBTS = total_num_qubits

    # setting up all levels =2 (two-level qubits)
    level_num = num_levels #qubits
    levels = [level_num for i in range(TOTAL_N_QUBTS)]
    
    # IMPORTANT: device limit 954 qubits for (N of qubits)*(N of levels)
    qubit_hardware_limit_Dirac3 = 954
    
    if TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3:
        print("*** ERROR: TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3 = 954.")
        print("*** Reduce the number of qubits per variables, N_QUBTS, or number of variables, N_VAR. Stop now")
        abort()
    else:
        print("Number of Dirac3 levels used:", TOTAL_N_QUBTS * level_num, "out of", qubit_hardware_limit_Dirac3)
    
    # get response from QCI Dirac-3
    # preparing the request for QCI Dirac 3.
    from qci_client import JobStatus, QciClient
    from pprint import pprint
    url = "https://api.qci-prod.com"
    api_token = "0e0dfe7fe8b4fab10f8e3b58101f27ac"
    client = QciClient(url=url, api_token=api_token)
    
    # defining the  problem file
    file_int_problem = {
        "file_name": "dirac_3_integer_example",
        "file_config": {
            "polynomial": {
                "num_variables": TOTAL_N_QUBTS,  #SET THIS!
                "min_degree": 1,     #SET THIS!
                "max_degree": 2,     #SET THIS!
                "data": data_QCI
            }
        }
    }
    # sending the problem file to QCI computer and get file ID
    file_response_int_problem = client.upload_file(file=file_int_problem)
    #quit()
    
    # Relaxation parameters
    #num_samples = 5             #how many samples to run
    #relaxation_schedule = 1     #can be 1,2,3 ...see the manual
    
    job_body_int_problem = client.build_job_body(
        job_type='sample-hamiltonian-integer',
        job_name='test_integer_variable_hamiltonian_job', # user-defined string, optional
        job_tags=['tag1', 'tag2'],  # user-defined list of string identifiers, optional
        job_params={
            'device_type': 'dirac-3',
            'num_samples': num_samples,
            'relaxation_schedule': relaxation_schedule,
            'num_levels': levels, #Example: [2,2,2] for 3 qubits
        },
        polynomial_file_id=file_response_int_problem['file_id'],
    )
    
    PRINT_THIS_5 = False
    if PRINT_THIS_5:
        print(file_response_int_problem)
        print(job_body_int_problem)
    #quit()
    
    job_response_int_problem = client.process_job(job_body=job_body_int_problem)
    assert job_response_int_problem["status"] == JobStatus.COMPLETED.value
    
    # sample Dirac3 response =
    #job_response_int_problem = {'job_info': {'job_id': '686344445e5ac839b11f2aa4', 'job_submission': {'job_name': 'test_integer_variable_hamiltonian_job', 'job_tags': ['tag1', 'tag2'], 'problem_config': {'qudit_hamiltonian_optimization': {'polynomial_file_id': '686344435e085526322aa485'}}, 'device_config': {'dirac-3_qudit': {'num_levels': [2, 2, 2, 2, 2, 2, 2, 2], 'num_samples': 5, 'relaxation_schedule': 1}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-01T02:13:24.395Z', 'queued_at_rfc3339nano': '2025-07-01T02:13:24.396Z', 'running_at_rfc3339nano': '2025-07-01T02:14:22.181Z', 'completed_at_rfc3339nano': '2025-07-01T02:14:34.283Z'}, 'job_result': {'file_id': '6863448a5e085526322aa48b', 'device_usage_s': 7}}, 'status': 'COMPLETED', 'results': {'counts': [3, 1, 1], 'energies': [-67.5625, -67.375, -67.3125], 'solutions': [[1, 1, 1, 0, 1, 0, 1, 0], [1, 0, 1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1, 1, 0]]}}
    
    # now response is ready, process it.
    print("DIRAC-3: energies:")
    print(job_response_int_problem['results']['energies'])
    print("counts:")
    print(job_response_int_problem['results']['counts'])
    if VERBOSE:
        print("Full QCI response =")
        print(job_response_int_problem)
        
    # taking min energy solution
    energy_list = job_response_int_problem['results']['energies']   #example: [-67.5625, -67.375, -67.3125]
    min_en = min(energy_list)                       #minimum energy, e.g. -67.5625
    min_idx = energy_list.index(min_en)             #index of min energy, e.g., 0
    Qci_answer_list = job_response_int_problem['results']['solutions'][min_idx] #qubit solution for min energy, e.g. [1, 1, 1, 0, 1, 0, 1, 0]
    
    #Qci_answer_list = job_response_int_problem['results']['solutions'][0]
    #print("Qci_answer_list =", Qci_answer_list)
   
    if _verbose:
        print("LEAVING minimize_QCI_Dirac3_E")
        print("RETURNING x =", Qci_answer_list, "; E =", min_en)

    return Qci_answer_list, min_en


def minimize_QCI_Dirac3_E(Q_np, num_samples, quantum_flags):

    # rewriting data for QCI in a new format data list from numpy array for QCI Dirac 3.
    # Example fo the data in the polynomial format:
    # data_QCI =
        # [{'idx': [0, 1], 'val': -12.375},
        # {'idx': [0, 2], 'val': -23.5},
        # {'idx': [0, 3], 'val': -42.0},
        # ...
        # {'idx': [6, 7], 'val': 5.0},
        # {'idx': [6, 8], 'val': 10.0},
        # {'idx': [7, 8], 'val': 20.0}]
 
    # Total number of Qubits in the system:
    #TOTAL_N_QUBTS = N_QUBTS*N_VAR
    TOTAL_N_QUBTS = len(Q_np)
    
    # numpy array with the Q from the function input (just dummy redifinition)
    Q_qci = Q_np
    
    # creating an empy list to populate with Q in the polynomial format.
    data_QCI = []
    
    # setting up all levels =2 (two-level qubits)
    level_num = 2 #qubits
    levels = [level_num for i in range(TOTAL_N_QUBTS)]
    
    # IMPORTANT: device limit 954 qubits for (N of qubits)*(N of levels)
    qubit_hardware_limit_Dirac3 = 954
    if TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3:
        print("*** ERROR: TOTAL_N_QUBTS * level_num > qubit_hardware_limit_Dirac3 = 954.")
        print("*** Reduce the number of qubits per variables, N_QUBTS, or number of variables, N_VAR. Stop now")
        abort()
    else:
        print("Number of Dirac3 levels used:", TOTAL_N_QUBTS * level_num, "out of", qubit_hardware_limit_Dirac3)
    
    # get response from QCI Dirac-3
    if not quantum_flags['READ_QCI_RESULTS_FROM_DATAFILE'] :
    
        #diagonal elements in data_QCI
        for i in range(TOTAL_N_QUBTS):
            #print("Q_qci[", i, ",", i,"]=", Q_qci[i,i])
            val = float(Q_qci[i,i])
            idx = [0, i+1]
            elem = {'idx': idx, 'val': val}
            data_QCI.append(elem)
            
        #off-diag elements in data_QCI:
        for i in range(0,TOTAL_N_QUBTS-1):
            for j in range(i+1, TOTAL_N_QUBTS):
                idx = [i+1, j+1]
                val = float(Q_qci[i,j] * 2.0)
                elem = {'idx': idx, 'val': val}
                data_QCI.append(elem)

        #printing
        PRINT_THIS_5 = _verbose
        if PRINT_THIS_5:
            import pprint
            print("data_QCI =")
            pprint.pprint(data_QCI)

        # preparing the request for QCI Dirac 3.
        from qci_client import JobStatus, QciClient
        from pprint import pprint
        url = "https://api.qci-prod.com"
        api_token = "0e0dfe7fe8b4fab10f8e3b58101f27ac"
        client = QciClient(url=url, api_token=api_token)
        
        #test data
        #data_QCI_1 = \
        #    [{'idx': [0, 1], 'val': -2.0},\
        #     {'idx': [0, 2], 'val': -3.0},\
        #     {'idx': [0, 3], 'val': 5.0},\
        #     {'idx': [1, 2], 'val': 2.0},\
        #     {'idx': [1, 3], 'val': 4.0},\
        #     {'idx': [2, 3], 'val': 4.0}]
        
        # defining the  problem file
        file_int_problem = {
            "file_name": "dirac_3_integer_example",
            "file_config": {
                "polynomial": {
                    "num_variables": TOTAL_N_QUBTS,  #SET THIS!
                    "min_degree": 1,     #SET THIS!
                    "max_degree": 2,     #SET THIS!
                    "data": data_QCI
                }
            }
        }
        # sending the problem file to QCI computer and get file ID
        file_response_int_problem = client.upload_file(file=file_int_problem)
        #quit()
        
        # Relaxation parameters
        #num_samples = 5             #how many samples to run
        relaxation_schedule = 1     #can be 1,2,3 ...see the manual
        
        job_body_int_problem = client.build_job_body(
            job_type='sample-hamiltonian-integer',
            job_name='test_integer_variable_hamiltonian_job', # user-defined string, optional
            job_tags=['tag1', 'tag2'],  # user-defined list of string identifiers, optional
            job_params={
                'device_type': 'dirac-3',
                'num_samples': num_samples,
                'relaxation_schedule': relaxation_schedule,
                'num_levels': levels, #Example: [2,2,2] for 3 qubits
            },
            polynomial_file_id=file_response_int_problem['file_id'],
        )
            
        if PRINT_THIS_5:
            print(file_response_int_problem)
            print(job_body_int_problem)
        #quit()
        
        job_response_int_problem = client.process_job(job_body=job_body_int_problem)
        assert job_response_int_problem["status"] == JobStatus.COMPLETED.value
        
        # sample Dirac3 response =
        #job_response_int_problem = {'job_info': {'job_id': '686344445e5ac839b11f2aa4', 'job_submission': {'job_name': 'test_integer_variable_hamiltonian_job', 'job_tags': ['tag1', 'tag2'], 'problem_config': {'qudit_hamiltonian_optimization': {'polynomial_file_id': '686344435e085526322aa485'}}, 'device_config': {'dirac-3_qudit': {'num_levels': [2, 2, 2, 2, 2, 2, 2, 2], 'num_samples': 5, 'relaxation_schedule': 1}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-01T02:13:24.395Z', 'queued_at_rfc3339nano': '2025-07-01T02:13:24.396Z', 'running_at_rfc3339nano': '2025-07-01T02:14:22.181Z', 'completed_at_rfc3339nano': '2025-07-01T02:14:34.283Z'}, 'job_result': {'file_id': '6863448a5e085526322aa48b', 'device_usage_s': 7}}, 'status': 'COMPLETED', 'results': {'counts': [3, 1, 1], 'energies': [-67.5625, -67.375, -67.3125], 'solutions': [[1, 1, 1, 0, 1, 0, 1, 0], [1, 0, 1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1, 1, 0]]}}
        
        # saving response to json file
        from datetime import datetime
        current_datetime = datetime.now()
        timestamp = current_datetime.strftime('%Y-%m-%d-%H.%M')

        model_dir = 'saved_models/'
        os.makedirs(model_dir, exist_ok=True)
        
        path_to_response = model_dir + timestamp + '-response-dirac3.json'
        try:
            with open(path_to_response, 'w') as f:
                json.dump(job_response_int_problem, f, indent=4)
            print(f"minimize_QCI_Dirac1_E :: QCI response saved to {path_to_response}")
        except Exception as e:
            print(f"minimize_QCI_Dirac3_E :: Can't save response to file. Error: {e}")
            
        
    else:
        # Read results in job_response from a file
        print("*** INFO :: minimize_QCI_Dirac3_E :: results are read from json file")
        
        #file_path = 'saved_data/results.json'
        file_path = quantum_flags['SAVED_DATA_FILENAME']
        try:
            with open(file_path, 'r') as file:
                job_response_int_problem = json.load(file)
            print("JSON data loaded successfully")
            #print(job_response)
        except FileNotFoundError:
            print(f"Error: The file '{file_path}' was not found.")
            quit()
        except json.JSONDecodeError:
            print(f"Error: Could not decode JSON from '{file_path}'. Check file format.")
            quit()
        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            quit()
        
    # now response is ready, process it.
    print("DIRAC-3: energies:")
    print(job_response_int_problem['results']['energies'])
    print("counts:")
    print(job_response_int_problem['results']['counts'])
    if VERBOSE:
        print("Full QCI response =")
        print(job_response_int_problem)
        
    # taking min energy solution
    energy_list = job_response_int_problem['results']['energies']   #example: [-67.5625, -67.375, -67.3125]
    min_en = min(energy_list)                       #minimum energy, e.g. -67.5625
    min_idx = energy_list.index(min_en)             #index of min energy, e.g., 0
    Qci_answer_list = job_response_int_problem['results']['solutions'][min_idx] #qubit solution for min energy, e.g. [1, 1, 1, 0, 1, 0, 1, 0]
    
    #Qci_answer_list = job_response_int_problem['results']['solutions'][0]
    #print("Qci_answer_list =", Qci_answer_list)

    #saving answer list
    SAVE_THIS = False
    if SAVE_THIS:
        
        with open('Qci_answer_list.json', 'w') as file:
            json.dump(Qci_answer_list, file)
        print("\nThe minimum-energy qubit list written to file Qci_answer_list.json")
   
    if _verbose:
        print("LEAVING minimize_QCI_Dirac3_E")
        print("RETURNING x =", Qci_answer_list, "; E =", min_en)

    return Qci_answer_list, min_en


def get_weights_from_QCI_response(Qci_answer_list, N_VAR, v, c, qci_qbt_num):
    # restoring variables fron qci answer #########
    
    vars = np.zeros(N_VAR)

    sample = Qci_answer_list
    for i in range(len(sample)):
        (var, qnum) = qci_qbt_num[str(i)]
        qvalue = sample[i]
        vars[var] += v[qnum] * qvalue
        if _verbose:
            print("i=", i, ", var=", var, ", qnum=", qnum, ", value=", qvalue)
        
    vars = vars - c
    vars_list = vars.tolist()
    return vars_list
    
    
def mimic_QCI_response(N_VAR, N_QUBTS):
    """
    Structure of the QCI Dirac 3 response:
    job_response_int_problem={'job_info': {'job_id': '686344445e5ac839b11f2aa4', 'job_submission': {'job_name': 'test_integer_variable_hamiltonian_job', 'job_tags': ['tag1', 'tag2'], 'problem_config': {'qudit_hamiltonian_optimization': {'polynomial_file_id': '686344435e085526322aa485'}}, 'device_config': {'dirac-3_qudit': {'num_levels': [2, 2, 2, 2, 2, 2, 2, 2], 'num_samples': 5, 'relaxation_schedule': 1}}}, 'job_status': {'submitted_at_rfc3339nano': '2025-07-01T02:13:24.395Z', 'queued_at_rfc3339nano': '2025-07-01T02:13:24.396Z', 'running_at_rfc3339nano': '2025-07-01T02:14:22.181Z', 'completed_at_rfc3339nano': '2025-07-01T02:14:34.283Z'}, 'job_result': {'file_id': '6863448a5e085526322aa48b', 'device_usage_s': 7}}, 'status': 'COMPLETED', 'results': {'counts': [3, 1, 1], 'energies': [-67.5625, -67.375, -67.3125], 'solutions': [[1, 1, 1, 0, 1, 0, 1, 0], [1, 0, 1, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1, 1, 0]]}}
    print("energies:")
    print(job_response_int_problem['results']['energies'])
    print("counts:")
    print(job_response_int_problem['results']['counts'])
    
    print("Full QCI response =")
    print(job_response_int_problem)
        
    # taking min energy solution
    energy_list = job_response_int_problem['results']['energies']   #example: [-67.5625, -67.375, -67.3125]
    min_en = min(energy_list)                       #minimum energy, e.g. -67.5625
    min_idx = energy_list.index(min_en)             #index of min energy, e.g., 0
    Qci_answer_list = qubit_sol=job_response_int_problem['results']['solutions'][min_idx] #qubit solution for min energy, e.g. [1, 1, 1, 0, 1, 0, 1, 0]
    
    #Qci_answer_list = job_response_int_problem['results']['solutions'][0]
    print("Qci_answer_list =", Qci_answer_list)
    """
    
    TOTAL_N_QUBTS = N_QUBTS*N_VAR
    
    # generate random sample of length TOTAL_N_QUBTS to mimic QCI response
    import random
    Qci_answer_list = []
    
    for i in range(TOTAL_N_QUBTS):
        Qci_answer_list.append(random.randint(0, 1))
    
    #print("MIMIC QCI RESPONSE")
    return Qci_answer_list

def mimic_QCI_response_E(Q):
    """
    Mimics QCI response.
    """
    
    def Xt_Q_X(Q,x):
        """ Returns E = Xt * Q * X """
        Qx = np.matmul(Q, x)
        xQx = np.matmul( np.transpose(x), Qx)
        return xQx
    
    # generate random sample
    import random
    num_qubits = len(Q)
    X = np.random.randint(0, 2, size=num_qubits)
    E = Xt_Q_X(Q,X)
    
    print("*** WARNING: MIMIC QCI RESPONSE ARCHITECHTURE IS CHOSEN")
    return X, E

def compare_results_3(X_qci, X_AX_B, X_classic_min, parms):
    """
    Compare the results of QCI, AX=B and classical minimization.
    Save the results to file.
    """
    
    X_qci = np.array(X_qci)
    X_AX_B = np.array(X_AX_B)
    X_classic_min = np.array(X_classic_min)
    
    # calculating norms
    norm_qci = np.linalg.norm(X_qci)
    norm_classic_min = np.linalg.norm(X_classic_min)
    norm_AX_B = np.linalg.norm(X_AX_B)
    
    # compare QCI and classic minimization, |X_qci - X_classic_min|
    delta_qci_classic = np.linalg.norm(X_qci - X_classic_min)
    try:
        rel_delta_qci_classic = delta_qci_classic/np.sqrt(norm_qci*norm_classic_min)
    except:
        rel_delta_qci_classic = -1.0 #indicator of zero denominator
        
    # compare QCI and AX_B minimization, |X_qci - X_classic_min|
    delta_qci_AX_B = np.linalg.norm(X_qci - X_AX_B)
    try:
        rel_delta_qci_AX_B = delta_qci_AX_B/np.sqrt(norm_qci*norm_AX_B)
    except:
        rel_delta_qci_AX_B = -1.0 #indicator of zero denominator
    
    # compare classic_min and AX_B minimization, |X_qci - X_classic_min|
    delta_classic_AX_B = np.linalg.norm(X_classic_min - X_AX_B)
    try:
        rel_delta_classic_AX_B = delta_classic_AX_B/np.sqrt(norm_classic_min*norm_AX_B)
    except:
        rel_delta_classic_AX_B = -1.0 #indicator of zero denominator
    
    # save the result to file
    results_dir = './results/'
    try:
        os.makedirs(results_dir, exist_ok=True)
        if _verbose:
            print(f"Directory '{results_dir}' created or already exists.")
    except OSError as e:
        print(f"Error creating directory '{results_dir}': {e}")
    
    # create results.dat file and write column labels there
    file_name = results_dir + 'results.dat'
    try:
        with open(file_name, 'x') as f: #note exclusive 'x' mode!
            f.write("#(1) N, (2) M, (3) N_QUBTS, ")
            f.write("(4) shift, (5) delta_qci_classic, ")
            f.write("(6) delta_qci_AX_B, (7) delta_classic_AX_B, ")
            f.write("(8) rel_delta_qci_classic, (9) rel_delta_qci_AX_B, ")
            f.write("(10) rel_delta_classic_AX_B, (11) num_samples on QCI\n#\n")
    except:
        if _verbose:
            print(f"file {file_name} was created")
            
    # write results to file
    try:
        with open(file_name, 'a') as f:
            f.write(f"{parms['N']} \t{parms['M']} \t{parms['N_QUBTS']}")
            f.write(f"\t{parms['shift']} \t{delta_qci_classic}")
            f.write(f"\t{delta_qci_AX_B} \t{delta_classic_AX_B}")
            f.write(f"\t{rel_delta_qci_classic} \t{rel_delta_qci_AX_B}")
            f.write(f"\t{rel_delta_classic_AX_B} \t{parms['num_samples']}\n")
            print(f"\nThe results are saves to file {file_name}")
    except IOError as e:
        print(f"Error writing to file {file_name}: {e}")
                

def compare_results_3a(X_qci, X_AX_B, X_classic_min, num_samples, parms):
    """
    Compare the results of QCI, AX=B and classical minimization.
    Save the results to file.
    """
    
    X_qci = np.array(X_qci)
    X_AX_B = np.array(X_AX_B)
    X_classic_min = np.array(X_classic_min)
    
    # calculating norms
    norm_qci = np.linalg.norm(X_qci)
    norm_classic_min = np.linalg.norm(X_classic_min)
    norm_AX_B = np.linalg.norm(X_AX_B)
    
    # compare QCI and classic minimization, |X_qci - X_classic_min|
    delta_qci_classic = np.linalg.norm(X_qci - X_classic_min)
    try:
        rel_delta_qci_classic = delta_qci_classic/np.sqrt(norm_qci*norm_classic_min)
    except:
        rel_delta_qci_classic = -1.0 #indicator of zero denominator
        
    # compare QCI and AX_B minimization, |X_qci - X_classic_min|
    delta_qci_AX_B = np.linalg.norm(X_qci - X_AX_B)
    try:
        rel_delta_qci_AX_B = delta_qci_AX_B/np.sqrt(norm_qci*norm_AX_B)
    except:
        rel_delta_qci_AX_B = -1.0 #indicator of zero denominator
    
    # compare classic_min and AX_B minimization, |X_qci - X_classic_min|
    delta_classic_AX_B = np.linalg.norm(X_classic_min - X_AX_B)
    try:
        rel_delta_classic_AX_B = delta_classic_AX_B/np.sqrt(norm_classic_min*norm_AX_B)
    except:
        rel_delta_classic_AX_B = -1.0 #indicator of zero denominator
    
    # save the result to file
    results_dir = './results/'
    try:
        os.makedirs(results_dir, exist_ok=True)
        if _verbose:
            print(f"Directory '{results_dir}' created or already exists.")
    except OSError as e:
        print(f"Error creating directory '{results_dir}': {e}")
    
    # create results.dat file and write column labels there
    file_name = results_dir + 'results.dat'
    try:
        with open(file_name, 'x') as f: #note exclusive 'x' mode!
            f.write("#(1) N, (2) M, (3) N_QUBTS, ")
            f.write("(4) shift, (5) delta_qci_classic, ")
            f.write("(6) delta_qci_AX_B, (7) delta_classic_AX_B, ")
            f.write("(8) rel_delta_qci_classic, (9) rel_delta_qci_AX_B, ")
            f.write("(10) rel_delta_classic_AX_B, (11) num_samples on QCI\n#\n")
    except:
        if _verbose:
            print(f"file {file_name} was created")
            
    # write results to file
    try:
        with open(file_name, 'a') as f:
            f.write(f"{parms['N']} \t{parms['M']} \t{parms['N_QUBTS']}")
            f.write(f"\t{parms['shift']} \t{delta_qci_classic}")
            f.write(f"\t{delta_qci_AX_B} \t{delta_classic_AX_B}")
            f.write(f"\t{rel_delta_qci_classic} \t{rel_delta_qci_AX_B}")
            f.write(f"\t{rel_delta_classic_AX_B} \t{num_samples}\n")
            print(f"\nThe results are saves to file {file_name}")
    except IOError as e:
        print(f"Error writing to file {file_name}: {e}")
                

def get_binary_classification_quantum_weights(N_QUBTS, shift, QUANTUM_ARCH, A, B):
    """ Get quantum weights"""
    
    N_VAR = len(A[0]) #bumber of variables in A
    
    # get Q as a dict - NORMAL LINE
    Q_dict, v, c = get_Q_dict(
        A=A,
        B=B,
        N_QUBTS=N_QUBTS,
        shift=shift,
        quantum_flags=quantum_flags)
    
    if _verbose:
        print(Q_np)
    
    # Possible architechtures: DIRAC3, DIRAC1, MIMIC
    #QUANTUM_ARCH = 'DIRAC1'
    #QUANTUM_ARCH = 'DIRAC3'
    #QUANTUM_ARCH = 'MIMIC'
    
    if QUANTUM_ARCH == 'DIRAC1':
        #get minimization results from QCI Dirac 1
        Qci_answer_list = minimize_QCI_Dirac1(Q_np)
        
    elif QUANTUM_ARCH == 'DIRAC3':
        Qci_answer_list = minimize_QCI_Dirac3(Q_np)
        
    elif QUANTUM_ARCH == 'MIMIC':
        Qci_answer_list = mimic_QCI_response(N_VAR, N_QUBTS)

    else:
        print(f"\n*** Architecture {QUANTUM_ARCH} is not implemented. Stop\n")
        exit()
    
    if _verbose:
        print("Qci_answer_list =", Qci_answer_list)
    
    #get weights
    vars_list_qci = get_weights_from_QCI_response(Qci_answer_list, N_VAR, v, c, qci_qbt_num)
    
    return vars_list_qci
    

def graph_matrix_Q(Q):
    """
        Q should be a numpy array
    """
    import numpy as np
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D
    
    # Get the dimensions of the array
    rows, cols = Q.shape
    
    # Prepare x, y, and z coordinates for the bars
    # x and y will represent the array indices, z will represent the values
    xpos, ypos = np.meshgrid(np.arange(cols), np.arange(rows))
    xpos = xpos.flatten()
    ypos = ypos.flatten()
    zpos = np.zeros_like(xpos) # Starting height of bars is 0
    
    # Define the dimensions of each bar
    dx = dy = 0.8 # Width and depth of bars
    dz = Q.flatten() # Height of bars corresponds to array values
    
    # Create the 3D plot
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')

    # Plot the 3D bars
    ax.bar3d(xpos, ypos, zpos, dx, dy, dz, color='skyblue', alpha=0.5)
    
    # Set the Z-axis range
    #ax.set_zlim(-100, 100)
    
    # Set axis labels
    ax.set_xlabel('Column Index')
    ax.set_ylabel('Row Index')
    ax.set_zlabel('Value')

    # Set title
    ax.set_title('3D Bar Graph of Q')

    # Show the plot
    plt.show()

def graph_heat_map_Q(Q):
    """ Get 2D graph of Q as a heat map"""
    import matplotlib.pyplot as plt
    
    plt.imshow(Q, cmap='inferno', interpolation='nearest') # 'viridis' is a good default colormap

    # 3. Add a color bar to show the mapping of values to colors
    plt.colorbar(label='Value')

    # 4. Add labels and title for clarity
    plt.xlabel('Column Index')
    plt.ylabel('Row Index')
    plt.title('2D Heatmap of Q')

    # 5. Display the plot
    plt.show()

def get_binary_classification_quantum_weights_E(N_QUBTS, shift, QUANTUM_ARCH, A, B, num_samples, quantum_flags):
    """ Get quantum weights"""
    
    N_VAR = len(A[0]) #bumber of variables in A
    
    # get Q as a DWave dict
    #Q_dict, v, c = get_Q_dict(A=A, B=B, N_QUBTS=N_QUBTS, shift=shift)
    
    # calculate Q
    #print("\n*** INFO:: get_binary_classification_quantum_weights_E:: step 1 - calculate Q_dict", flush=True)
    
    Q_dict, v, c = get_Q_dict(
        A=A,
        B=B,
        N_QUBTS=N_QUBTS,
        shift=shift,
        quantum_flags=quantum_flags)
    
    # get Q as numpy array for QCI from dict
    #print("\n*** INFO:: get_binary_classification_quantum_weights_E:: step 2 - calculate Q_np", flush=True)
    
    #Q_np, qci_qbt_num = Q_dict_2_QCI_np(
    #    Q_dict=Q_dict,
    #    N_VAR=N_VAR,
    #    N_QUBTS=N_QUBTS)
    
    #print Q_dict
    #print("get_binary_classification_quantum_weights_E:: Q_dict =")
    #import pprint
    #pprint.pprint(Q_dict)
    #quit()
    
    #ADD_SPRING_POTENTIAL = quantum_flags["ADD_SPRING_POTENTIAL"]
    # add the spring potential
    if quantum_flags["ADD_SPRING_POTENTIAL"]:
        lam = 1.0
        # get spring potential DWave style
        Q_spring = get_Q_spring(N_VAR, N_QUBTS, v, c, lam)
        # add spring potential to regular Q_dict
        Q_dict = add_Q_spring_to_Q(Q_dict, Q_spring)
        print(f"*** INFO:: get_binary_classification_quantum_weights_E:: Spring potential added to Q_dict.\nlambda = {lam}")
    
    # get Q as numpy array for QCI from dict
    Q_np, qci_qbt_num = Q_dict_2_QCI_np(Q_dict=Q_dict, N_VAR=N_VAR, N_QUBTS=N_QUBTS)

    if _verbose:
        print(Q_np)
    
    # print condition number
    print("\n*** INFO:: get_binary_classification_quantum_weights_E::")
    #print("Condition number of Q =", np.linalg.cond(Q_np))
    print(f"Min(Q) = {np.min(Q_np)}, max(Q) = {np.max(Q_np)}", flush=True)
    
    #GRAPH_MATRIX_Q = False

    if quantum_flags['GRAPH_MATRIX_Q']:
        # make a graph of matrix Q
        print("\n*** INFO:: get_binary_classification_quantum_weights_E::")
        print("Making graph for Q. Close the graph to continue.")
        graph_matrix_Q(Q_np)
        graph_heat_map_Q(Q_np)
    
        #graph_matrix_Q(np.log(np.abs(Q_np)))
        #graph_heat_map_Q(np.log(np.abs(Q_np)))

    
    
    # Possible architechtures: DIRAC3, DIRAC1, MIMIC
    #QUANTUM_ARCH = 'DIRAC1'
    #QUANTUM_ARCH = 'DIRAC3'
    #QUANTUM_ARCH = 'MIMIC'
    
    if QUANTUM_ARCH == 'DIRAC1':
        #get minimization results from QCI Dirac 1
        Qci_answer_list, E = minimize_QCI_Dirac1_E(
            Q_np,
            num_samples=num_samples,
            quantum_flags=quantum_flags)
        
    elif QUANTUM_ARCH == 'DIRAC3':
        Qci_answer_list, E = minimize_QCI_Dirac3_E(
            Q_np,
            num_samples=num_samples,
            quantum_flags=quantum_flags)
        
    elif QUANTUM_ARCH == 'MIMIC':
        Qci_answer_list, E = mimic_QCI_response_E(Q_np) #N_VAR, N_QUBTS)
    
    elif QUANTUM_ARCH == 'CLASSICAL_FAST':
        from scipy.optimize import minimize
        def classical_min(Q_np):
            x0 = np.random.rand(len(Q_np))
            result = minimize(lambda x: 0.5 * x @ Q_np @ x, x0, method='L-BFGS-B', bounds=[(0,1)]*len(x0))
            return result.x.tolist(), result.fun
    
        Qci_answer_list, E = classical_min(Q_np)
        if VERBOSE:
            print("get_binary_classification_quantum_weights_E ::")
            print(f"solution = {Qci_answer_list}, energy = {E}")

    else:
        print(f"\n*** Architecture {QUANTUM_ARCH} is not implemented. Stop\n")
        exit()
    
    if _verbose:
        print("Qci_answer_list =", Qci_answer_list)
    
    #get weights
    vars_list_qci = get_weights_from_QCI_response(Qci_answer_list, N_VAR, v, c, qci_qbt_num)
    
    # quick fix for type mismatch from different architechture codes
    Qci_answer_list = np.array(Qci_answer_list)
    
    def save_model():
        """ save model to file"""
        # dir to saved model
        model_dir = './saved_models/'
        
        # create dir if it doesn't exist
        try:
            os.makedirs(model_dir, exist_ok=True)
            if _verbose:
                print(f"Directory '{model_dir}' created or already exists.")
        except OSError as e:
            print(f"*** Error creating directory '{model_dir}': {e}")
            print("Model not saved. Continue without saving.")
            return
        
        # make timestamp to mark the model
        from datetime import datetime
        current_datetime = datetime.now()
        timestamp = current_datetime.strftime('%Y-%m-%d-%H.%M')

        # save Q_np as zipped numpy
        path_to_Q_np = model_dir + timestamp + "-Q_np.npz"
        try:
            np.savez(path_to_Q_np, array1=Q_np)
            print(f"save_model :: Q_np saved to {path_to_Q_np}")
        except Exception as e:
            print(f"*** Error :: save_model :: error occurred while saving {path_to_Q_np}: {e}")
        
        # make parm dictionary to store other data
        model_parms = {
            "v": v,
            "c": c,
            "N_QUBTS": N_QUBTS,
            "shift": shift,
            "N_VAR": N_VAR,
            "QUANTUM_ARCH": QUANTUM_ARCH,
            "qci_qbt_num": qci_qbt_num,
            "Qci_answer_list": Qci_answer_list.tolist(),
            "E": E,
            "weights": vars_list_qci,
        }
        
        # save dict to json
        path_to_parms = model_dir + timestamp + "-model_parms.json"
        try:
            with open(path_to_parms, 'w') as f:
                json.dump(model_parms, f, indent=4)
            print(f"save_model :: model parms saved to {path_to_parms}")
        except Exception as e:
            print(f"*** Error :: save_model :: error occurred while saving {path_to_parms}: {e}")
        
    save_model()
    
    return vars_list_qci, E

def get_Q_spring(N_VAR, N_QUBTS, v, c, lam):
    """
        get Q_spring for the spring potential
        Q_spring = - lam * (x1^2 + x2^2 + ...)
        
        The function returns Q_spring in DWave style.
    """
    # making Q, DWave style
    Q_spring = {}

    # linear part
    for var in range(N_VAR):
        for qnum in range(N_QUBTS):
            #q = 'q_' + str(var) + '_' + str(qnum)
            q = num_2_qbt_name (var, qnum)
            Q_spring[(q,q)] = - lam * (v[qnum]**2 - 2.0*c*v[qnum])

    # qubit cross-product part (same variable)
    for var in range(N_VAR):
        for qnum1 in range(N_QUBTS-1):
            for qnum2 in range(qnum1+1, N_QUBTS):
                q = num_2_qbt_name(var, qnum1)
                p = num_2_qbt_name(var, qnum2)
                Q_spring[(q,p)] = - lam * 2.0 * v[qnum1] * v[qnum2]

    return Q_spring

def add_Q_spring_to_Q(Q, Q_spring):
    """
    Returns the new dictionary that combines two 
    dicts, Q and Q_spring. 
    Both dictionaries should be DWave style.
    """
    from collections import defaultdict
    
    dd = defaultdict(list)
    dics = [Q, Q_spring]
    
    #merge two dicts to a dict dd
    for dic in dics:
        for key, val in dic.items():
            dd[key].append(val)
    
    # merged dict dd now has format:
    # {('0000_0000', '0000_0000'): [100.0, 16.25],
    #         ('0000_0000', '0000_0001'): [200.0, -5.0],
    #         ('0000_0001', '0000_0001'): [30.0]})
    
    # summing up the elements of dd dict
    Q_new = {}
    for k in dd.keys():
        Q_new[k] = sum(dd[k])
    
    return Q_new
    
def main():
    """ Code for testing the functions with test A and B"""
    #print("Initializing, loading parameters...", end='', flush=True); tstart = time.time()

    """
    N_QUBTS = 4 #qubits per variables
    shift = 2 #how deep we go to the decimal part
    # The test for solution {x1 -> 1.25, x2 -> -0.5}
    A = np.array([[3,2],[1,1]])
    B = np.array([2.75,0.75])
    """
    
    # test with x=1 equation.
    N_QUBTS = 4 #qubits per variables
    shift = 0 #how deep we go to the decimal part
    # The test for solution {x1 -> 1.25, x2 -> -0.5}
    A = np.array([[1]])
    B = np.array([1])
    
    #N_VAR = len(A[0]) #bumber of variables in A
    
    damping = 0.00
    
    QUANTUM_ARCH = 'MIMIC'
    #QUANTUM_ARCH = 'DIRAC1'
    #QUANTUM_ARCH = 'DIRAC3'

    # get weights from AX=B
    vars_list_qci = get_binary_classification_quantum_weights(N_QUBTS, shift, QUANTUM_ARCH, A, B)
    
    vars_list_exact = correctAnswer_np(A, B, damp = damping)

    #compare the weights:
    compare_results(A, B, vars_list_qci, vars_list_exact)
    




if __name__ == '__main__':
    main()
