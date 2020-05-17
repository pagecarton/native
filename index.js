import { AsyncStorage } from 'AsyncStorage';
const PROTOCOL = 'http://';
const DOMAIN = 'localhost';
const PORT = ':8888';
const PATH = '/app';
const HOME_URL = PROTOCOL + DOMAIN + PORT + PATH;
const VERSION = '0.0.1';

const urls = {
    favicon: "/favicon.ico",
    logo: "/img/logo.png",
    siteInfo: "/widgets/Application_SiteInfo?pc_widget_output_method=JSON",
    navigation: "/widgets/Ayoola_Menu?pc_widget_output_method=JSON",
    authentication: "/widgets/NativeApp_Authenticate?pc_widget_output_method=JSON",
    logout: "/widgets/NativeApp_Authenticate_Logout?pc_widget_output_method=JSON",
    posts: "/widgets/Application_Article_ShowAll?pc_widget_output_method=JSON"
};
const namespace = 'PAGECARTON' + HOME_URL;
global[namespace] = {};


/**
 *
 * @param expireInMinutes
 * @returns {Date}
 */
const getExpiryDate = function (expireInSeconds) {
    const now = new Date();
    let expireTime = new Date(now);
    expireTime.setSeconds(now.getSeconds() + expireInSeconds);
    return expireTime;
}

const setStaticResource = function ({ name, value, expiry = 3600, storage = true }) {
    expiry = getExpiryDate(expiry);
    let data = { value, expiry }
    storage? AsyncStorage.setItem(namespace + name, JSON.stringify(data)).then().catch() : null;
    global[namespace][name] = data;
}

const getStaticResource = function (name) {
    if (global[namespace][name]) {
        if ({ value, expiry } = global[namespace][name]) {
            if (new Date(expiry) < (new Date())) {
                resetStaticServerResource(name);
                return false;
            }
            return value;
        }
    }

}

const getStaticServerResource = function (name) {
    if (getStaticResource(name)) {
        return getStaticResource(name);
    }
    else {
        getServerResource({ name });
    }

}
const resetStaticServerResource = function (name) {
    global[namespace][name] = undefined;
    AsyncStorage.removeItem(namespace + name)
}

const getServerResource = function ({ name, url, method, contentType, refresh, postData, expiry }) {
    return new Promise((resolve) => {
        if (!refresh) {
            if (getStaticResource(name)) {
                resolve(getStaticResource(name))
            }
            AsyncStorage.getItem(namespace + name).then((data) => {
                if (data !== null) {
                    data = JSON.parse(data);
                    if ({ value, expiry } = data) {
                        if (new Date(expiry) < (new Date())) {
                            resetStaticServerResource(name);
                        }
                        else {
                            setStaticResource({ name, value, expiry, storage:false });
                            value ? resolve(value) : null
                        }
                    }
                }
            })
        }
        if (!url) {
            url = urls[name];
        }
        //   console.log(url);
        const link = HOME_URL + url;
        fetch(link, {
            method: method ? method : 'POST',
            headers: {
                Accept: contentType ? contentType : 'application/json',
                'Content-Type': contentType ? contentType : 'application/json',
            },
            body: postData ? JSON.stringify(postData) : {},
        }).then((response) => response.json()).then((value) => {
            setStaticResource({ name, value, expiry });
            value ? resolve(value) : value;
        }).catch((error) => {
            console.log(error);
        });


    })
}


export default {
    DOMAIN,
    HOME_URL,
    favicon: HOME_URL + "/favicon.ico",
    logo: HOME_URL + "/img/logo.png",
    getServerResource,
    getStaticServerResource,
    getStaticResource,
    resetStaticServerResource,
    navigation: getServerResource({ name: "navigation" }),
    siteInfo: getServerResource({ name: "siteInfo" }),
    posts: getServerResource({ name: "posts" })
}