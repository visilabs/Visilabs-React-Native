import AsyncStorage from '@react-native-async-storage/async-storage';

const key = 'seen'

export const dots = (str, len) => {
    if (str.length > len) {
        return str.substr(0, len) + "..."
    }
    return str
}

export const seen = (index) => {
    getSeenList().then(val => {
        let arr = (NUSC(val) ? [] : val.split(","));
        if (arr.indexOf(index) < 0) {
            arr.push(index);
            setSeenList(arr);
        }
    })
}

export const getSeenList = async () => {
    return (await AsyncStorage.getItem(key))
}

export const setSeenList = (arr) => {
    if (!arr) var arr = []

    AsyncStorage.setItem(key, arr.toString());
}

export const returnSeenStories = (obj,callback,actid,moveShownToEnd) => {
    if (!obj) var obj = {}

    getSeenList().then(keys => {

        if (NUSC(keys)) {
            callback(obj)
            return
        }

        let seenKeys = keys.split(","), seenList = [], notSeenList = []

        obj.forEach((story,i) => {
            if (seenKeys.indexOf(returnId(actid,story.title)) >= 0) {
                story.seen = true

                seenList = obj.filter((item)=>{
                    return item.seen == true
                });

                notSeenList = obj.filter((item)=>{
                    return item.seen == false
                });
            }
            
            if (i+1 >= obj.length) {
                if (moveShownToEnd) callback([...notSeenList,...seenList])
                else callback(obj)
            }
        });
    })
}

export const clearSeenList = () => {
    AsyncStorage.setItem(key, "");
    return "Success clean";
}

export const returnBorderRadius = (shape, size) => {
    switch (shape) {
        case "50%":
            return size / 2
            break;
        case "10%":
            return 5
            break;
        case "":
            return 0
            break;
        default:
            return size / 2
            break;
    }
}

export const NUSC = (str) => {
    if (str === null || str === undefined || str === "") {
        return true
    }
    return false
}

export const splitParameters = (str) => {
    if (!str) return
        
    const parameters = str.split("&")
    
    let result = {}
    
    parameters.forEach(values => {
        let tempArr = values.split("=")
        result[tempArr[0]] = tempArr[1];
    });

    return result
}

export const returnActid = (str) => {
    if (!str || !str["OM.zn"]) return
        
    const parameters = str["OM.zn"].split("-")

    return parameters[1]
}

export const returnId = (actid,title) => {
    if (!actid || !title) return

    return escape(actid+"-"+title)
}

