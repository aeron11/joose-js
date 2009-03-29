Joose.Namespace.Manager = new Joose.MetaClass('Joose.Namespace.Manager', {
    
    my : {
        
        have : {
            global : null
        },
        
        
        methods : {
            
            initialize : function(){
                var global = this.global = new Joose.Namespace.Keeper('', {
                    constructor : function(){
                        throw "Global namespace cant be instantiated"
                    }
                }).c;
                
                
                global.meta.ns.container = Joose.top;
                global.meta.parent = global;
                
                global.meta.ns.addProperty('__global__', global.meta.ns);
                
                new Joose.Namespace.Keeper("Joose", {
                    constructor : Joose
                });
                
                
                new Joose.Namespace.Keeper("Joose.Kernel", {
                    constructor : Joose.Kernel
                });
                
                
                global.meta.ns.addProperty('Joose', Joose)
                
                Joose.meta.ns.addProperty('Kernel', Joose.Kernel);                
            },
            
            
            getCurrent: function (){
                var limit = 50;
                var msg = "getCurrent() failed with limit=" + limit;
                var cur = arguments.callee.caller;
                
                while (cur && limit) {
                    if (cur.__JOOSE_MODULE__) return cur.__JOOSE_MODULE__;
                    
                    //sometimes throws an exception (seems when called from DOM event callback)
                    try {
                        cur = cur.CALLER || cur.caller;
                    } catch (e) {
                        cur = null
                    }
                    limit--;
                }
                
                //cur == null - we have reached the outer space )
                if (limit) return this.global;
                
                throw msg;
            },
            
            
            //this function establishing the full "namespace chain" (including the last element)
            create : function (nsName, metaClass, props) {
                var parts   = Joose.S.saneSplit(nsName, '.');
                if (!parts.length) throw "Cant prepare namespace with empty name = [" + nsName + "]"; 
                
                var object  = this.getCurrent();
                var soFar   = Joose.S.saneSplit(object.meta.name, '.');
                
                for(var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    var isLast = i == parts.length - 1;
                    
                    if (part == "meta" || part == "my" || !part) throw "Module name [" + nsName + "] may not include a part called 'meta' or 'my' or empty part."
                    
                    var cur = object.meta.ns.getProperty(part);
                    
                    soFar.push(part)
                    var soFarName = soFar.join(".")
                    
                    if (typeof cur == "undefined") {
                    	var nsKeeper = isLast ? new metaClass(soFarName, props).c : new Joose.Namespace.Keeper(soFarName).c;
                    	
                        object.meta.ns.addProperty(nsKeeper.meta.localName, nsKeeper);
                        
                        cur = nsKeeper;
                    } else if (isLast && cur && cur.meta) {
                    	
                    	if (cur.meta instanceof metaClass)
                    		cur.meta.extend(props);
                    	else if (cur.meta instanceof Joose.Namespace.Keeper) 
                    		cur.meta.plant(new metaClass(soFarName, props).c);
                    	else 
                    		throw "Re-declaration of class with different meta is not allowed";                    		
                    	
                    } else if (!(cur && cur.meta && cur.meta.meta && cur.meta.meta.hasAttribute('ns'))) throw "Trying to setup module " + soFarName + " failed. There is already something: " + cur
                        
                    object = cur;
                }
                
                return object
            },
            
            
            executeIn : function (ns, func, scope, argsArray) {
                var namespaceKeeper = function (func, ns) {
                    arguments.callee.__JOOSE_MODULE__ = ns;
                    return func.apply(scope || this, argsArray || []);
                };
                
                return namespaceKeeper(func, ns)
            }
            
        }
    }
    
}).c;