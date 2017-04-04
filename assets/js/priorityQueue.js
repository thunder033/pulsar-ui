/**
 * Created by gjrwcs on 9/22/2016.
 */

(function(){
    "use strict";

    /**
     * Priority Queue Node
     * @param priority
     * @param item
     * @constructor
     */
    function Node(priority, item){
        this.priority = priority;
        this.item = item;
        this.next = null;
    }

    /**
     * Priority Queue Iterator
     * @param root
     * @constructor
     */
    function Iterator(root){
        this.current = root;
    }

    /**
     * Traverses the iterator to the next node and returns its item
     * @returns {*}
     */
    Iterator.prototype.next = function(){
        if(this.current){
            var node = this.current;
            this.current = node.next;
            return node.item;
        }
        return null;
    };

    /**
     * Indicates if the iterator has traversed all nodes
     * @returns {boolean}
     */
    Iterator.prototype.isEnd = function(){
        return this.current === null;
    };

    /**
     * Priority Queue
     * lower priority items (close to 0) will be dequeued first
     * @constructor
     */
    function PriorityQueue() {
        this.root = null;
        this.iterator = null;
    }

    /**
     * Add a new item to the queue according to the given priority
     * Items with priority equal an existing node will be enqueued after those node
     * @param {number} priority
     * @param {*} item
     */
    PriorityQueue.prototype.enqueue = function(priority, item){

        var node = new Node(priority, item);
        if(this.root === null){
            this.root = node;
        }
        else if(priority < this.root.priority){
            node.next = this.root;
            this.root = node;
        }
        else {
            var current = this.root;
            while(current.next !== null){
                if(priority >= current.next.priority){
                    current = current.next;
                }
                else {
                    node.next = current.next;
                    current.next = node;
                    return;
                }
            }
            current.next = node;
        }
    };

    /**
     * Remove the next item from the queue
     * @returns {*}
     */
    PriorityQueue.prototype.dequeue = function(){
        if(this.root !== null){
            var node = this.root;
            this.root = node.next;
            return node.item;
        }
        return null;
    };

    /**
     * Get an iterate for the queue
     * @returns {null|Iterator}
     */
    PriorityQueue.prototype.getIterator = function () {
        if(this.iterator === null){
            this.iterator = new Iterator(this.root);
        }

        this.iterator.current = this.root;
        return this.iterator;
    };

    /**
     * See the next item in queue
     * @returns {*|null}
     */
    PriorityQueue.prototype.peek = function(){
        return this.root ? this.root.item : null;
    };

    /**
     * Empty the queue
     */
    PriorityQueue.prototype.clear = function(){
        this.root = null;
    };

    /**
     * Creates an array of the items in the priority queue
     * @returns {Array}
     */
    PriorityQueue.prototype.asArray = function(){
        var arr = [],
            it = this.getIterator();
        while(!it.isEnd()){
            arr.push(it.next());
        }

        return arr;
    };

    window.PriorityQueue = PriorityQueue;
})();
