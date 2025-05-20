// hooks/useCart.ts
import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface CartItem extends IProductResponse {
  cartQuantity: number;
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.netPrice * item.cartQuantity,
    0
  );

  const deliveryCharges = cartItems.reduce(
    (sum, item) => sum + (item.deliveryCharges || 0),
    0
  );

  const total = subtotal + deliveryCharges;

  // Helper function to calculate delivery charges
  const calculateDeliveryCharges = (product: IProductResponse): number => {
    return product.deliveryCharges;
  };

  // Helper for formatted delivery date
  const formattedDeliveryDate = (deliveryDays: number) => {
    const currentDate = new Date();
    const deliveryDate = new Date(
      currentDate.getTime() + deliveryDays * 24 * 60 * 60 * 1000
    );
    return deliveryDate
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "/");
  };

  const fetchCartItems = useCallback(async () => {
    try {
      setLoading(true);
      const userResponse = await fetch("/api/user/cart");
      const userData = await userResponse.json();

      if (!userData.success || !userData.data) {
        setError("Please login to view cart");
        setCartItems([]); // Clear cart if not logged in
        return;
      }

      const cartProductIds = userData.data.cart || [];
      const productPromises = cartProductIds.map((id: string) =>
        fetch(`/api/products/${id}`).then((res) => res.json())
      );

      const productResponses = await Promise.all(productPromises);
      const cartProducts = productResponses
        .filter((response) => response.success)
        .map((response) => ({
          ...response.data,
          cartQuantity: 1,
          deliveryCharges: calculateDeliveryCharges(response.data),
        }));

      setCartItems(cartProducts);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setError("Failed to load cart items");
    } finally {
      setLoading(false);
    }
  }, []); // Add useCallback to prevent unnecessary recreations

  const updateQuantity = async (productId: string, newQuantity: number) => {
    try {
      if (newQuantity < 1) return;

      // Optimistically update the UI
      setCartItems((prev) =>
        prev.map((item) =>
          item._id === productId ? { ...item, cartQuantity: newQuantity } : item
        )
      );

      const response = await fetch("/api/user/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      const data = await response.json();

      if (!data.success) {
        // Revert changes if API call fails
        await fetchCartItems();
        throw new Error(data.error);
      }
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast({
        title: "Error",
        description: "Failed to update quantity",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      // Optimistically update UI
      setCartItems((prev) => prev.filter((item) => item._id !== productId));

      const response = await fetch("/api/user/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!data.success) {
        // Revert if API call fails
        await fetchCartItems();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart",
        variant: "destructive",
      });
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const existingItem = cartItems.find((item) => item._id === productId);

      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) =>
            item._id === productId
              ? { ...item, cartQuantity: item.cartQuantity + 1 }
              : item
          )
        );
      } else {
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();

        if (productData.success) {
          setCartItems((prev) => [
            ...prev,
            {
              ...productData.data,
              cartQuantity: 1,
              deliveryCharges: calculateDeliveryCharges(productData.data),
            },
          ]);
        }
      }

      const response = await fetch("/api/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();

      if (!data.success) {
        await fetchCartItems();
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error adding item to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  return {
    cartItems,
    loading,
    error,
    subtotal,
    deliveryCharges,
    total,
    formattedDeliveryDate,
    fetchCartItems,
    updateQuantity,
    removeFromCart,
    addToCart,
  };
};
