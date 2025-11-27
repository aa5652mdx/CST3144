const { createApp } = Vue;

createApp({
  data() {
    return {
      // LINK TO YOUR LIVE RENDER BACKEND
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
    // Calculates total price (Price * Qty)
    cartTotalPrice() {
      return this.cart.reduce((total, item) => total + (item.price * item.qty), 0);
    },
    
    // Computes the total number of items in the cart
    cartTotalItems() {
      return this.cart.reduce((total, item) => total + item.qty, 0);
    },

    // Regex Validation for Name (Letters and spaces only)
    validName() {
      return /^[a-zA-Z\s]+$/.test(this.checkoutName);
    },

    // Regex Validation for Phone (Numbers only)
    validPhone() {
      return /^\d+$/.test(this.checkoutPhone);
    },

    // Logic to enable the checkout button
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
          if (typeof a[key] === 'string' && typeof b[key] === 'string') {
            comparison = a[key].localeCompare(b[key]);
          }
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
      try {
        const response = await fetch(`${this.API_URL}/lessons`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        this.lessons = data;
      } catch (error) {
        console.error("Error fetching lessons:", error);
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

    // Removes an item from the cart and updates lesson spaces locally
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
        total: this.cartTotalPrice 
      };
      
      try {
        const response = await fetch(`${this.API_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });

        if (!response.ok) throw new Error('Order failed');

        this.message = "Order submitted successfully! Your booking is confirmed.";
        
        // Reset state after successful checkout
        this.cart = [];
        this.checkoutName = "";
        this.checkoutPhone = "";
        this.cartVisible = false;

        // Re-fetch lessons to get the updated space counts from the database
        this.fetchLessons(); 

      } catch (error) {
        this.message = `ERROR: Checkout failed.`;
      }
    },
    
    toggleCart() {
      this.cartVisible = !this.cartVisible;
    },

    toggleSortOrder() {
       let [key, order] = this.sortOption.split('-');
       order = order === 'asc' ? 'desc' : 'asc';
       this.sortOption = `${key}-${order}`;
    }
  },
  
  mounted() {
    this.fetchLessons();
  }
}).mount('#app');