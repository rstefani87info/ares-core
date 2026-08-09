import { randomUUID } from "crypto";
export class TreeNode {
     
    static isTreeNode(node) {
      if (!node) return false;
      if (node instanceof TreeNode) return true;
      const isObjectLike = typeof node === "object" || typeof node === "function";
      if (!isObjectLike) return false;

      try {
        const requiredMethods = [
          "getChildrenProperty",
          "setChildrenProperty",
          "getChildrenAsArray",
          "getChildren",
          "setParent",
          "getParent",
          "getRoot",
          "getPath",
          "isLeaf",
          "isRoot",
          "isChildOf",
          "isDescendantOf",
          "getNodeFrom",
          "forEach",
        ];

        const hasMethods = requiredMethods.every((m) => typeof node[m] === "function");
        if (!hasMethods) return false;

        const hasIdentifier =
          typeof node.identifier === "string" ||
          typeof node.identifier === "number" ||
          typeof node.identifier === "bigint" ||
          typeof node.identifier === "symbol";
        if (!hasIdentifier) return false;

        const isIterable = typeof node?.[Symbol.iterator] === "function";
        return isIterable;
      } catch {
        return false;
      }
    }

    constructor(identifier, value, driver={}) {
      Object.assign(this, value);
      this._parent = null;
      this.identifier = identifier ?? randomUUID();
      const c =this.getChildrenProperty();
      this.setChildrenProperty(c);
      this.driver = driver;
    }

    setType(value) {
      this._type = value;
      return this;
    }

    getType() {
      return this._type;
    }

    setParentNode(parent) {
      if (!(parent instanceof TreeNode) && parent !== null) {
        throw new Error("Parent must be a TreeNode instance or null");
      }
      this._parent = parent;
      return this;
    }

    getParentNode() {
      return this._parent;
    }

    set parent(value) {
      this.setParentNode(value);
    }

    get parent() {
      return this.getParentNode();
    }

    set type(value) {
      this.setType(value);
    }

    get type() {
      return this.getType();
    }

    serialize() {
      return this.driver.serialize(this);
    }

    /**
     * Create a child node of the current node
     * 
     * @param {*} identifier 
     * @param {*} value 
     * @returns {TreeNode|null}
     */
    createChildInstance(identifier,value) {
      return new TreeNode(identifier,value, this.driver);
    }

    /*
    * Get the children property of the current node
    *
    * @returns {Object}
    * 
    * */
    getChildrenProperty() {
      return this.children;
    }

    /**
     * Set the children property of the current node
     * 
     * @param {Object} children - The children object to set
     */
    setChildrenProperty(children) {
        if (typeof children === "string") children = JSON.parse(children);
        this.children = children;
        Object.entries(children).forEach(([key, obj]) => {
            this.children[key] = this.createChildInstance(key, obj);
            this.children[key]._parent = this;
        });
    }

    /**
     * Set the parent node of the current node
     * @param {TreeNode} parent - The parent node to set
     */
    setParent(parent, clone = true) {
        if (!(parent instanceof TreeNode) && parent !== null) {
            throw new Error('Parent must be a TreeNode instance or null');
        }
        if(!clone) {
            const p = this.getParent();
            try {
                if(p) delete p.getChildrenProperty()[this.identifier];
            } catch (error) {
                console.error("Error removing child from parent:", error);
            }
        }
        const childValue = clone
          ? JSON.parse(
              JSON.stringify(this, (key, value) => {
                if (key === "_parent" || key === "driver") return undefined;
                return value;
              })
            )
          : null;
        const child = clone ? this.createChildInstance(this.identifier, childValue) : this;
        if(parent ) {
            parent.getChildrenProperty()[child.identifier]=child;
        }
        child._parent = parent;

        return child;
    }

    /**
     * Get the children of the current node
     * 
     * @returns {Array}
     */
    getChildrenAsArray() {
        const c =this.getChildrenProperty();
        if(!c)return [];
        return Object.values(this.getChildrenProperty());
    }
  
   /**
    *  Get the children of the current node
    * 
    * @returns {Array}
    */
    getChildren() {
      return this.getChildrenAsArray();
    }
    
    /**
     * Makes the TreeNode iterable
     * Allows using the node in for...of loops
     * @returns {Iterator}
     */
    [Symbol.iterator]() {
      const children = this.getChildrenAsArray();
      let index = 0;
      
      return {
        next: () => {
          if (index < children.length) {
            return { value: children[index++], done: false };
          } else {
            return { done: true };
          }
        }
      };
    }
    
    /**
     * Executes a provided function once for each child node
     * @param {Function} callback - Function to execute for each element
     * @param {Object} [thisArg] - Value to use as this when executing callback
     */
    forEach(callback, thisArg) {
      const children = this.getChildrenAsArray();
      children.forEach((child, index) => {
        callback.call(thisArg || this, child, index, children);
      });
    }
  
    /**
     * Get the parent node of the current node
     * @returns {TreeNode|null} - The parent node or null if it's the root node
     */
    getParent() {
      return this.getParentNode();
    }
  
    /**
     * Get the child of the current node recursively
     * 
     * @param  {...any} ids 
     * @returns 
     */
    getNodeFrom(...ids){
      if (ids.length === 0) {
        return this;
      }
  
      const [currentCode, ...remainingCodes] = ids;
      const nextNode = this.getChildrenProperty()[currentCode];
  
      if (!nextNode) {
        return null;
      }
      return nextNode.getNodeFrom(...remainingCodes); 
    }
  
    /**
     * Get the root node of the tree
     * @returns {TreeNode} - The root node
     */
    getRoot() {
      let node = this;
      while (node) {
        const parent =
          typeof node.getParent === "function" ? node.getParent() : node._parent;
        if (!parent) return node;
        node = parent;
      }
      return node;
    }
    /**
     * Get the path from the root node to the current node
     * @returns {Array} - The path from the root node to the current node
     */
    getPath() {
      const path = [];
      let node = this;
      while (node) {
        path.unshift(node.identifier);
        node = node.getParent();
      }
      return path;
    }
  
    /**
     * Check if the current node is a leaf node
     * @returns {boolean} - True if the node is a leaf node, false otherwise
     */
    isLeaf() {
      return !this.getChildrenProperty() || Object.keys(this.getChildrenProperty()).length === 0;
    }
  
    /**
     * Check if the current node is a root node
     * @returns {boolean} - True if the node is a root node, false otherwise
     */
    isRoot() {
      return !this.getParent();
    }
  
    /**
     * Check if the current node is a child of the specified node
     * @param {TreeNode} node - The parent node to check
     * @returns {boolean} - True if the node is a child of the specified node, false otherwise
     */
    isChildOf(node) {
      return this.getParent() === node;
    }
    /**
     * Check if the current node is a descendant of the specified node
     * @param {TreeNode} node - The parent node to check
     * @returns {boolean} - True if the node is a descendant of the specified node, false otherwise
     */
    isDescendantOf(node) {
      let currentNode = this.getParent();
      while (currentNode) {
        if (currentNode === node) {
          return true;
        }
        currentNode = currentNode.getParent();
      }
      return false;
    }
  
    /**
     * Get the depth of the node in the tree
     * 
     * @param {*} identifier 
     * @returns 
     */
    isLike(identifier,ignoreCase=true){
        if(
            typeof identifier === 'string'
            || typeof identifier === 'boolean'
            || typeof identifier === 'number'
            || typeof identifier === 'bigint'
            || typeof identifier === 'symbol'
        ){
           if(ignoreCase){ 
               return this.identifier.toLowerCase().includes( `${identifier}`.toLowerCase()); 
           }
           return this.identifier.includes(identifier);
        }
        return false;  
    }
  }
