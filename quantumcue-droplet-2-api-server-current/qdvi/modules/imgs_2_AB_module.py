# read images, make A and B

import glob, os, pandas
from PIL import Image
import numpy as np

_verbose = False
VERBOSE = _verbose

def scale_A(A):
    """ Scale A"""
    n = len(A[0])
    A = A / n
    return A

def get_mnist_binary_labels(B, digit):
    """ return numpy array of binary labels (0 or 1) for mnist 
        Arguments:  B (numpy array or list) - vector of labels
                    digit (int) - for which digit to train
    """
    
    # define operation on a single label as lambda function
    lbl_to_bin = lambda label, digit: 1 if int(label) == digit else 0
    
    # convert label array B to binary for given digit
    b = [ lbl_to_bin(label,digit) for label in B ]
    return b

def normalize_label(y, linear_resolution):
    """ Modify a single label y according to linear resolution to keep the weights withing ~ -1...1 range 
    """
    #f = y * linear_resolution**1.4142135623730951 / 150. #sqrt(2)
    #f = y * linear_resolution**1.4142135623730951 / 150. #sqrt(2)
    f = y * (0.25 + linear_resolution**1.0 / 100.)
    #f = y #no renormalizaiton, for testing purposes
    return float(f)
        
def scale_brain_binary_labels(B, linear_resolution):
    """ Modify brain binary labels:
        1. label "2" -> label "1" for AD and 
           keep 0 for CN
        2. Scale AD labels to keep weights 
           -1...1 for all resolutions
    """
    # Modifying the labels for brain dataset binary classification:
    #   a. This is because AD pics labeled as "2" instead of "1" in labels.csv:
    B=B/2
    #   b. Renormalization of the labels to keep weights ~ -1...1:
    B = [normalize_label(y, linear_resolution) for y in B]
    return B
    
def scale_labels(B, linear_resolution):
    """ Scale labels to keep weights 
           -1...1 for all resolutions
    """
    #  Renormalization of the labels to keep weights ~ -1...1:
    B = [normalize_label(y, linear_resolution) for y in B]
    return B

def csv_labels_to_df(data_dir):
    """ Load labels in csv to pandas data frame.
    The df content is something like that:
          filename  label
     0   img00000.png  5
     1   img00001.png  0
     2   img00002.png  4
         ...
         
    Usage:
        df, filename_col, label_col = csv_labels_to_df(data_dir)
    Returns:
        df - pandas dataframe
        filename_col - header for the filename column in df,
        label_col - header for label column in df
    """
    # Import csv file with labels:
    csv_file_list = glob.glob(data_dir + '*.csv')
    #check if there is a label .csv at all
    if len(csv_file_list) == 0:
        print("Error:: csv_file_list is not found.")
        message = "Misisng .csv file with labels." + \
                  "Please upload a data set with a .csv file in it."
        return {'error': 'Error', 'message': message}
    csv_file = csv_file_list[0]
    if VERBOSE:
        print("csv_labels_to_df:: csv_file =", csv_file)
    df = pandas.read_csv(csv_file)
    col_headers = list(df.columns.values)
    filename_col = col_headers[0]   # normally, 'filename'
    label_col = col_headers[1]      # normally, 'label'
    return df, filename_col, label_col
      
def png_images_to_list(data_dir, df, filename_col, label_col, resolution):
    """ Load images and labels to list.
        Assume, the images are grayscale, and the labels are not cathegorical.
        Usage:
            pic_list, label_list = png_images_to_list(data_dir, df, filename_col, label_col, resolution)
        Note: add Image.open("image.jpg").convert('L') to convert to grayscale
    """
    pic_list = []
    label_list = []
    filename_list = glob.glob(data_dir + '*.png')
    #print("filename_list =", filename_list)
    # loading all pictures into a list
    for file in filename_list:
        filename = os.path.basename(file)
    
        # Loading images, converting to grayscale
        im_frame = Image.open(file).convert('L')
        im_resized = im_frame.resize(resolution, resample=Image.BICUBIC)
        np_frame = np.array(im_resized)/255.0
        list_frame = np_frame.tolist()
        pic_list.append(list_frame)
        
        #take label from dataframe df
        index = df.index[df[filename_col].str.match(filename)].tolist()[0]
        label = df.iloc[index][label_col]
        label_list.append(int(label))
    return pic_list, label_list

def flatten_images(img_list):
    """
        Flatten the images for AX=B method.
    """
    flat_list = []
    for image in img_list:
        flat_list.append([item for sub_list in image for item in sub_list])
    return flat_list
        
def get_extended_A_B(flatten_img_list, label_list):
    """ 
        Take the flatten image list and label list 
        and make numpy arrays A abd B for 
        binary classification.
        Usage:
            A, B = get_binary_A_B(flatten_img_list, label_list)
        Returns numpy A (extended with 1) and numpy B.
    """
    extended_img_list = []
    for l in flatten_img_list:
        l.append(1)
        extended_img_list.append(l)
    return np.array(extended_img_list, dtype='f'), np.array(label_list, dtype='f')

def get_A_B_from_data_dir(data_dir, resolution):
    """ Get A,B for given resoliution from directory data_dir
    """
    # read the labels dataframe, read filename and label col headers
    df, filename_col, label_col = csv_labels_to_df(data_dir=data_dir)

    # read images, make lists of images and labels
    img_list, label_list = png_images_to_list(
        data_dir=data_dir,
        df=df,
        filename_col=filename_col,
        label_col=label_col,
        resolution=resolution)
        
    # flattening the image for AX=B method
    flatten_img_list = flatten_images(img_list=img_list)

    # get extended, formatted A and B as numpy arrays for binary AX=B
    A, B = get_extended_A_B(flatten_img_list, label_list)

    return A, B


def main():
    
    data_dir = "/Users/german/Work/ML_Yura_Matrix_Method/Mosaic_2025/July-8-2025-read-images-module/data/ADNI-test-binary/"

    resolution=(2,2)
    
    A,B = get_A_B_from_data_dir(data_dir, resolution)
    
    PRINT_THIS = True
    if PRINT_THIS:
        print("A =", A)
        print("B =", B)


if __name__ == '__main__':
    main()




