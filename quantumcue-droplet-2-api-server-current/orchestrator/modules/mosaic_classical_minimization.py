# Mosaic minimization, classical.
# July 12, 2025

import numpy as np
import random
import math
import copy

VERBOSE = False

def get_var_sublists(num_qubits, num_vars_in_sublist):
    """ Randomizes the list of variables from 0 to num_qubits-1
    and splits it into sublists with the length of num_vars_in_sublist.
    
    Example:
        num_qubits = 3
        num_vars_in_sublist = 2
        sublists = get_var_sublists(num_qubits, num_vars_in_sublist)
    Can get sublists = [[0,2],[1]].
    
    The result os not deterministic because the function shuffles
    the variable list before splitting to sublists.
    """
    l = [i for i in range(num_qubits)]
    random.shuffle(l)
    chunks = []
    for i in range(0, len(l), num_vars_in_sublist):
        chunks.append(l[i:i + num_vars_in_sublist])
    return chunks

def get_overlapping_sublists(num_qubits, num_vars_in_sublist, sublist_overlap):
    """
    Make overlapping sublists from non-overlapping sublists.
    """
    # get regular sublists
    sublists = get_var_sublists(
        num_qubits=num_qubits,
        num_vars_in_sublist=num_vars_in_sublist)
    num_sublists = len(sublists)
    new_sublists = [] #init new sublists
    for s in range(len(sublists)): #cycle over sublist indices
        this_sublist = sublists[s] #this sublist
        s_prev = (s-1) % num_sublists #prev sublist index
        s_next = (s+1) % num_sublists #next sublist index
        #print("sublist ", s, "; prev =", s_prev, "; next =", s_next)
        prev_sublist = sublists[s_prev]
        next_sublist = sublists[s_next]
        #defining new, extended sublist
        extended_sublist = []
        #adding elements from previous sublist
        for idx in range(-sublist_overlap, 0):
            #print("adding from previous, idx =", idx, "; val =", prev_sublist[idx])
            extended_sublist.append(prev_sublist[idx])
        #adding elements from this sublist
        for el in this_sublist:
            extended_sublist.append(el)
        #adding elements from next sublist
        for idx in range(sublist_overlap):
            #print("adding from next, idx =", idx, "; val =", next_sublist[idx])
            extended_sublist.append(next_sublist[idx])
        #print(extended_sublist)
        new_sublists.append(extended_sublist)
    return new_sublists
            

def get_not_m_old(sublists, s):
    """
    This function takes sublists list of variables 
    and the number of  the current sublist number s and 
    returns a list of variables that is not in the s-th 
    sublist.
    
    Example:
        sublists = [[0,2],[1]]
        s = 1
        not_m = get_not_m(sublists, s)
    Returns not_m = [0,2]
    """
    not_m_1 = []
    #collect all sublists with number p != s:
    for p in range(len(sublists)):
        if p != s:
            not_m_1.append(sublists[p])
    #flatten not_m
    not_m = [item for sub in not_m_1 for item in sub]
    return not_m


def get_not_m(sublists, s):
    """
    This function takes sublists list of variables 
    and the number of  the current sublist number s and 
    returns a list of variables that is not in the s-th 
    sublist.
    
    Example:
        sublists = [[0,2],[1]]
        s = 1
        not_m = get_not_m(sublists, s)
    Returns not_m = [0,2]
    """
    not_m = []
    in_m = sublists[s]
    #getting full list of all elements in sublists
    full_list_1 = [item for sublist in sublists for item in sublist]
    #remove duplicates from full_list_1
    full_list = list(set(full_list_1))
    #cycling over all elems in full_list
    for el in full_list:
        if el not in in_m:
            not_m.append(el)
    return not_m


def get_bin_list(i,n):
    """ Convert integer i to binary form with length n.
        For example, i=1 with n=2 is converted to  01.
        The function returns a list of integers,
        for example [0, 1] in the example above.
        Example:
            l = get_bin_list(i=1,n=2)
        returns numpy array integers, for ex. l=[0,1]
    """
    bi = bin(i)     # shows like 0b1
    b = bi[2:]      # removing leading '0b', get 1
    # Now adding leading '0's to make it of length n
    # f.e., '01' instead of just '1',
    # with the full length = n
    for j in range(n-len(b)):
        b = '0' + b
    # now b is like '010110'.
    # Converting it to [0,1,0,1,1,0]
    l = [int(i) for i in b]
    return np.array(l)

def get_Q_m(Q, X, in_m, not_m):
    """ Make little Q_m from large Q to minimize"""
    m = len(in_m) # how many vars to minimize
    # 1. initialize:
    Q_ext = np.zeros((m,m))
    # 2. filling up the partial Q_ext
    for i in range(m):
        for j in range(m):
            this_i = in_m[i]
            this_j = in_m[j]
            Q_ext[i,j] = Q[this_i,this_j]
    # 3. adding terms to the diagonal due to fixed vars:
    # Q_ii += 2 * Sum_{j!=[m]} Q_ij x_j
    for i in range(m):
        this_i = in_m[i]
        add = 0
        for j in range(len(not_m)):
            this_j = not_m[j]
            add += 2 * Q[this_i,this_j] * X[this_j]
        Q_ext[i,i] += add
    return Q_ext


def classical_minimize_E(Q):
    """ Get vector x that minimizes Q.
        Unlike its production counterpart, classical_minimize,
        this classical_minimize_E returms the minimizing 
        binary vector and the respective E=min(Q)
    
        This is the classical (non-quantum) minimization that 
        tries all combinations of 0, 1 for each bit in x.
    
        The respective energy can be calculated as 
        E = Xt_Q_X(Q,x). 
    
        Example:
            Q = [[-2.  1.]
                 [ 1. -3.]]
            x = classical_minimize(Q)
            E = Xt_Q_X(Q,x)
            print(E, x)
    """
    n = len(Q) #number of variables
    E_min = 100000.0
    # varying all vars x picking min Q:
    for i in range(2**n):
        x = get_bin_list(i,n) #get all combinations of 0,1 in x
        E = Xt_Q_X(Q,x)
        if E < E_min:
            x_min = x
            E_min = E
    return x_min.tolist(), E_min

def classical_minimize(Q):
    """ Get vector x that minimizes Q.
    
        This is the classical minimiztion that 
        tries all combinations of 0, 1 for each bit in x.
    
        The respective energy can be calculated as 
        E = Xt_Q_X(Q,x). 
    
        Example:
            Q = [[-2.  1.]
                 [ 1. -3.]]
            x = classical_minimize(Q)
            E = Xt_Q_X(Q,x)
            print(E, x)
    """
    n = len(Q) #number of variables
    E_min = 100000.0
    # varying all vars x picking min Q:
    for i in range(2**n):
        x = get_bin_list(i,n) #get all combinations of 0,1 in x
        E = Xt_Q_X(Q,x)
        if E < E_min:
            x_min = x
            E_min = E
    return x_min.tolist()
 
def get_X_from_x(X, x, in_m):
    """ Restore X with partially minimized qubits x """
    for i in range(len(in_m)):
        idx = in_m[i]
        X[idx] = x[i]
    return(X)
    
def Xt_Q_X(Q,x):
    """ Returns E = Xt * Q * X """
    Qx = np.matmul(Q, x)
    xQx = np.matmul( np.transpose(x), Qx)
    return xQx
 
def minimize_over_sublist_s(Q, X, E, sublists, s):
    """
        Makes one iteration of minimization over an s-th sublist 
        in sublists list.
        
        Takes the full Q, the current E and X, the sublists, 
        and the current sublist number s as arguments.
    """
    # current list of minimizing and frozen variables
    in_m = sublists[s]
    not_m = get_not_m(sublists=sublists, s=s)
    #get little Q_m for minimizing vars and minimize
    Q_m = get_Q_m(Q, X, in_m, not_m) # get little Q_m
    x = classical_minimize(Q_m) #get min vector on Q_m
    X_new = get_X_from_x(X, x, in_m) #get new full vector
    E_new = Xt_Q_X(Q,X_new) #get new energy E = XT * Q* X # WAS ERROR HERE!!!!!!!!!
    # accept new X if the energy is less than the previous one
    if E_new <= E:
        E = E_new
        X = X_new
    return X, E
    
def one_minimization_iteration(Q, X, E, num_qubits, num_vars_in_sublist, sublist_overlap):
    """
    Generate sublists and make one minimization iteration 
    over all sublists. 
    
    Takes the matrix Q, the initial vector X, the respective 
    energy E, the number of qubits  num_qubits (which is
    num_qubits=len(Q)) and the 
    number of vars in sminimization sublists, num_vars_in_sublist,
    as parameters.  
    
    Returns the minimal vector X and energy E.
    """
    # get new sublists
    #sublists = get_var_sublists(num_qubits, num_vars_in_sublist)
    sublists = get_overlapping_sublists(
        num_qubits=num_qubits,
        num_vars_in_sublist=num_vars_in_sublist,
        sublist_overlap=sublist_overlap)
    if VERBOSE: print("sublists =", sublists)
    #One iteration over all sublists; s is the sublist counter:
    for s in range(len(sublists)):
        #one minimization interation over sublist s
        X, E = minimize_over_sublist_s(Q, X, E, sublists, s)
        if VERBOSE: print("s =", s, "; E =", E, "; X =", X)
    return X, E
 
def make_mosaic_minimization(Q, num_vars_in_sublist, sublist_overlap, n_iter):
    """
    Make mosaic minimization.
    """
    num_qubits = len(Q)
    
    # init X and E
    X = np.random.randint(0, 2, size=num_qubits)
    E = Xt_Q_X(Q,X)

    # Mosaic minimization iterations:
    for iter in range(n_iter):
        X, E = one_minimization_iteration(Q, X, E, num_qubits, num_vars_in_sublist, sublist_overlap)
        if VERBOSE:
            print("iter =", iter+1, "; E =", E, "; X =", X)
    return X, E

def make_full_minimization(Q):
    """
    Make full minimization
    """
    # init variables
    num_qubits = len(Q)
    num_vars_in_sublist = num_qubits #make sublist a full list
    sublist_overlap = 0
    
    #init X and E
    X = np.random.randint(0, 2, size=num_qubits)
    E = Xt_Q_X(Q,X)
    
    # full minimization
    X, E = one_minimization_iteration(Q, X, E, num_qubits, num_vars_in_sublist, sublist_overlap)
    return X, E

##########################
def test():
    
    #set up parameters
    num_qubits = 20
    num_vars_in_sublist = 5
    
    #number of mosaic minimization iterations
    n_iter = 20
    
    # make random matrix Q for testing
    a = np.random.randn(num_qubits,num_qubits)
    Q = 0.5 * (a + np.transpose(a))

    # make full minimization
    X1, E1 = make_full_minimization(Q)
    
    # make mosaic minimization
    X2, E2 = make_mosaic_minimization(Q, num_vars_in_sublist, sublist_overlap, n_iter)
    
    # difference in answers
    diff = np.linalg.norm(X1-X2)
    
    # printing the results
    if VERBOSE:
        print("\nMOSAIC FINAL ANSWER: \tE =", round(E2,4), "; \tX =", X2)
        print("EXACT FINAL ANSWER: \tE =", round(E1,4), "; \tX =", X1)
    
        print("\nEnergy difference =", E2-E1)
        print("Norm of vector difference =", diff, "\n")
    
    # returning True if the results coincide and False otherwise
    if diff < 0.1:
        return True
    else:
        return False

def main():
    num_of_tests = 10
    correct = 0
    for i in range(num_of_tests):
        print("\n\nTest # ", i+1)
        if test():
            correct += 1
    print("Total number of correct results =", correct, "out of", num_of_tests)
        
if __name__ == '__main__':
    main()


