
export class TreeNode {
     
    constructor(identifier,value) {
      Object.assign(this, value);
      this.identifier=identifier;
      const c =this.getChildrenProperty();
      this.setChildrenProperty(c);
    }

    /**
     * Create a child node of the current node
     * 
     * @param {*} identifier 
     * @param {*} value 
     * @returns {TreeNode|null}
     */
    createChildInstance(identifier,value) {
      return new TreeNode(identifier,value);
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
            this.children[key].getParent = ()=>this;
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
        ;
        if(!clone && this.getParent ) {
            const p = this.getParent()
            try {
                if(p) delete p.getChildrenProperty()[this.identifier];
            } catch (error) {
                console.error('Error removing child from parent:', error);
            }
        }
        const child = clone? JSON.parse(JSON.stringify(this)):this;
        if(parent ) {
            parent.getChildrenProperty()[child.identifier]=child;
        }
        child.getParent = ()=> parent;

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
     * @returns {GeoTreeNode|null} - The parent node or null if it's the root node
     */
    getParent() {
      return this.getParent();
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
     * @returns {GeoTreeNode} - The root node
     */
    getRoot() {
      let node = this;
      while (node.getParent()) {
        node = node.getParent();
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
     * @param {GeoTreeNode} node - The parent node to check
     * @returns {boolean} - True if the node is a child of the specified node, false otherwise
     */
    isChildOf(node) {
      return this.getParent() === node;
    }
    /**
     * Check if the current node is a descendant of the specified node
     * @param {GeoTreeNode} node - The parent node to check
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