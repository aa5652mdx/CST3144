const { createApp } = Vue;

createApp({
  data() {
    return {
      // API_URL is used by fetchLessons.
      API_URL: 'https://backendnova.onrender.com', 
      
      lessons: [], 
      cart: [],
      // Lesson filtering and searching
      searchQuery: '',
      sortOption: 'subject-asc',
      
      // Checkout form data
      checkoutName: '',
      checkoutPhone: '',
      
      // UI state
      cartVisible: false,
      message: '',
      
      // Commit Tracker #1
      // Commit Tracker #2
      // Commit Tracker #3
      // Commit Tracker #4
      // Commit Tracker #5
      // Commit Tracker #6
      // Commit Tracker #7
      // Commit Tracker #8
      // Commit Tracker #9
      // Commit Tracker #10
      // Commit Tracker #11
      // Commit Tracker #12
      // Commit Tracker #13
      // Commit Tracker #14
      // Commit Tracker #15
      // Commit Tracker #16
      // Commit Tracker #17
      // Commit Tracker #18
      // Commit Tracker #19
      // Commit Tracker #20
    };
  },
  
  computed: {
    // Computes the total number of items in the cart
    cartTotal() {
      return this.cart.reduce((total, item) => total + item.qty, 0);
    },
    
    // Computes the total price of all items in the cart
    cartPrice() {
      return this.cart.reduce((total, item) => total + (item.price * item.qty), 0);
    },
    
    // Filters and sorts the lessons based on user input
    filteredAndSortedLessons() {
      let filtered = this.lessons.filter(lesson => {
        const query = this.searchQuery.toLowerCase();
        return lesson.subject.toLowerCase().includes(query) || 
               lesson.location.toLowerCase().includes(query);
      });

      // Sorting logic
      filtered.sort((a, b) => {
        const [key, order] = this.sortOption.split('-');
        let comparison = 0;

        if (key === 'subject' || key === 'location') {
          comparison = a[key].localeCompare(b[key]);
        } else if (key === 'price') {
          comparison = a.price - b.price;
        } else if (key === 'spaces') {
          comparison = a.spaces - b.spaces;
        }

        return order === 'asc' ? comparison : comparison * -1;
      });

      return filtered;
    }
  },
  
  methods: {
    // Fetches lesson data from the backend API
    async fetchLessons() {
      this.message = "Loading lessons...";
      try {
        const response = await fetch(`${this.API_URL}/lessons`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        this.lessons = data;
        this.message = "Lessons loaded successfully.";
      } catch (error) {
        console.error("Error fetching lessons:", error);
        this.message = `ERROR: Failed to fetch lessons. Check API URL: ${this.API_URL}`;
      }
    },

    // Adds a lesson to the cart and updates its spaces locally
    addToCart(lesson) {
      if (lesson.spaces > 0) {
        // Find the lesson in the cart
        const cartItem = this.cart.find(item => item.lessonId === lesson._id);
        
        if (cartItem) {
          cartItem.qty += 1;
        } else {
          // Add new item to cart
          this.cart.push({ 
            // NOTE: lesson._id is the MongoDB ID, used as lessonId in the cart item
            lessonId: lesson._id, 
            qty: 1, 
            subject: lesson.subject,
            price: lesson.price
          });
        }
        
        // Decrement spaces locally
        lesson.spaces -= 1;
        this.message = `${lesson.subject} added to cart!`;
      } else {
        this.message = `Sorry, ${lesson.subject} is fully booked!`;
      }
    },

    // Removes an item from the cart and updates lesson spaces locally
    removeFromCart(item) {
      const lesson = this.lessons.find(l => l._id === item.lessonId);

      if (lesson) {
        // Increment spaces locally
        lesson.spaces += item.qty;
      }
      
      // Remove the item from the cart
      this.cart = this.cart.filter(cartItem => cartItem.lessonId !== item.lessonId);
      this.message = `${item.subject} removed from cart.`;
    },

    // Handles the checkout process
    async checkout() {
      if (!this.checkoutName || !this.checkoutPhone || this.cart.length === 0) {
        this.message = "Please fill in all required fields and ensure the cart is not empty.";
        return;
      }
      
      // --- FIX: Ensure keys match the backend's expected structure ---
      const orderData = {
        name: this.checkoutName,
        phone: this.checkoutPhone,
        // *** CRITICAL FIX 1: Rename 'items' to 'lessonIDs' ***
        lessonIDs: this.cart.map(item => ({ 
            // *** CRITICAL FIX 2: Ensure keys are 'lessonId' and 'qty' ***
            lessonId: item.lessonId, 
            qty: item.qty 
        })),
        total: this.cartPrice // Use cartPrice for the actual total
      };
      
      this.message = "Sending order to API...";

      try {
        const response = await fetch(`${this.API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          // Try to read the error message from the response body if available
          const errorResult = await response.json().catch(() => ({ error: response.statusText }));
          throw new Error(`Order submission failed: ${errorResult.error || response.statusText}`);
        }

        const result = await response.json();
        console.log("Order submitted successfully:", result);

        this.message = "Order submitted successfully! Your booking is confirmed.";
        
        // Reset state after successful checkout
        this.cart = [];
        this.checkoutName = "";
        this.checkoutPhone = "";
        this.cartVisible = false;

        // Re-fetch lessons to get the updated space counts from the database
        this.fetchLessons(); 

      } catch (error) {
        console.error("Checkout error:", error);
        this.message = `ERROR: Checkout failed. Details: ${error.message}`;
      }
    },
    
    // Toggles the visibility of the cart panel
    toggleCart() {
      this.cartVisible = !this.cartVisible;
    }
  },
  
  // Lifecycle hook to fetch lessons when the app starts
  mounted() {
    this.fetchLessons();
  }
}).mount('#app');