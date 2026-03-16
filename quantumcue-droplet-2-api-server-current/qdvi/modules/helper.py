# testing serialize -  deserialize QDVI
import json
import secrets, string
import time

def serialize_qdvi(d: dict) -> str:
    """
    Serialize: Convert a qdvi dictionary with tuple keys to a JSON string.
    
    Example:
    {('a','b'): 1.0} -> '{"qdvi": {"a|b": 1.0}}'
    """
    result = {}
    
    # example k = ('0000_0000', '0000_0000'), v = 0.72
    # make json compatible string with "|" separator
    # instead of tuple
    # like ('0000_0000', '0000_0000') => "0000_0000|0000_0000"
    for k, v in d.items():
        k_str = "|".join(str(x) for x in k) #serialized tuple
        result[k_str] = v # add {"k_str": v} pair to result

    return result

def deserialize_qdvi(data: str) -> dict:
    """ Deserialize: Convert a qdvi JSON back to a dictionary with tuple keys """
    #data = json.loads(json_str)

    result = {}

    for k, v in data.items():
        if "|" in k:
            k_tuple = tuple(k.split("|"))  # "a|b" -> ("a","b")
        result[k_tuple] = v

    return result


def get_random_string(length: int = 16) -> str:
    """ Generate string of 'length' number pf characters.
    Useful for job id, keys, etc """
    alphabet = string.ascii_letters + string.digits  # a-zA-Z0-9
    my_string = ''.join(secrets.choice(alphabet) for _ in range(length))
    #print(f"helper:: get_random_string:: my_string = {my_string}")
    return my_string
    
def get_job_id() -> str:
    """ Get job id. Format: J <Unix epoch time > RR <random 16 symbols> """
    epoch_str = str(int(time.time()))
    random_str = get_random_string(16)
    job_id = "J" + epoch_str + "RR" + random_str
    return job_id

if __name__ == "__main__":
    """Basic test"""

    # example of dict with qdvi
    dict = { "status": "OK",
            "ARCH": "qdvi",
            "data":{
                "qdvi": {
                    ('0000_0000', '0000_0000'): -2.875,
                    ('0000_0001', '0000_0001'): -5.5
                },
                "v": [0.25, 0.5, 1],
                "c": 1.0
            }
    }
    qdvi_dict = dict["data"]["qdvi"]
    print(qdvi_dict)

    # serilize: qdvi dict to json
    qdvi_json = serialize_qdvi(qdvi_dict)
    print(qdvi_json)

    # de-serialize: json to qdvi dict
    qdvi_dict = deserialize_qdvi(qdvi_json)
    print(qdvi_dict)
    
    my_string = get_random_string(32)
    print(my_string)



