export const Storage = {
    get: function(key, def) {
        try {
            var val = localStorage.getItem('karateLab.' + key);
            return val ? JSON.parse(val) : def;
        } catch(e) { return def; }
    },
    set: function(key, val) {
        try { localStorage.setItem('karateLab.' + key, JSON.stringify(val)); } catch(e) {}
    }
};
