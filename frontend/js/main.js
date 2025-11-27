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
    };
  },
  
  computed: {
    // 1. UPDATED: Specifically calculates PRICE (Price * Qty)
    finalCartPrice() {
      return this.cart.reduce((total, item) => total + (item.price * item.qty), 0);
    },
    
    // 2. UPDATED: Specifically calculates QUANTITY (just Qty)
    totalItemCount() {
      return this.cart.reduce((total, item) => total + item.qty, 0);
    },

    // 3. Name Validation: Returns TRUE if letters/spaces only
    validName() {
      return /^[a-zA-Z\s]+$/.test(this.checkoutName);
    },

    // 4. Phone Validation: Returns TRUE if numbers only
    validPhone() {
      return /^\d+$/.test(this.checkoutPhone);
    },

    // 5. Checkout Button Enable Logic
    isCheckoutEnabled() {
      return this.validName && this.validPhone && this.cart.length > 0;
    },
    
    // Filters and sorts the lessons based on user input
    sortedLessons() {
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
    },
    
    // Helper to flip the sort icon
    sortAscending() {
        return this.sortOption.endsWith('asc');
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
        this.message = ""; 
      } catch (error) {
        console.error("Error fetching lessons:", error);
        this.message = `ERROR: Failed to fetch lessons. Check API URL.`;
      }
    },

    // Adds a lesson to the cart
    addToCart(lesson) {
      if (lesson.spaces > 0) {
        // Find the lesson in the cart
        const cartItem = this.cart.find(item => item.lessonId === lesson._id);
        
        if (cartItem) {
          cartItem.qty += 1;
        } else {
          // Add new item to cart
          this.cart.push({ 
            lessonId: lesson._id, 
            qty: 1, 
            subject: lesson.subject,
            price: lesson.price,
            location: lesson.location
          });
        }
        
        // Decrement spaces locally
        lesson.spaces -= 1;
      }
    },

    // Removes an item from the cart
    removeFromCart(item) {
      const lesson = this.lessons.find(l => l._id === item.lessonId);

      if (lesson) {
        // Increment spaces locally
        lesson.spaces += item.qty;
      }
      
      // Remove the item from the cart
      this.cart = this.cart.filter(cartItem => cartItem.lessonId !== item.lessonId);
    },

    // Handles the checkout process
    async checkout() {
      if (!this.isCheckoutEnabled) {
        this.message = "Please fill in all required fields correctly.";
        return;
      }
      
      const orderData = {
        name: this.checkoutName,
        phone: this.checkoutPhone,
        lessonIDs: this.cart.map(item => ({ 
            lessonId: item.lessonId, 
            qty: item.qty 
        })),
        total: this.finalCartPrice 
      };
      
      this.message = "Sending order to API...";

      try {
        const response = await fetch(`${this.API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Order submission failed: ${errorText || response.statusText}`);
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
    },

    // Helper to toggle sort direction
    toggleSortOrder() {
       let [key, order] = this.sortOption.split('-');
       order = order === 'asc' ? 'desc' : 'asc';
       this.sortOption = `${key}-${order}`;
    }
  },
  
  // Lifecycle hook to fetch lessons when the app starts
  mounted() {
    this.fetchLessons();
    console.log("EduNova App Loaded v3");
  }
}).mount('#app');