import React, { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
  loadProducts: () => Promise<void>;
  products: Product[];
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const [products, setProducts] = useState<Product[]>([]);

  const addProduct = async (productId: number) => {
    try {
      const productAdded = products.filter(
        (product) => product.id == productId
      );

      const alreadyInCart = cart.filter((cartItem) => cartItem.id == productId);

      //increment AMOUNT if already added
      if (alreadyInCart.length) {
        const amountItem = alreadyInCart[0].amount + 1;

        //check stock
        const stockItem = await api.get(`/stock/${productId}`);

        if (stockItem && stockItem.data.amount < amountItem) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        cart[cart.indexOf(alreadyInCart[0])].amount = amountItem;

        setCart([...cart]);
      } else {
        //add a new item do array
        productAdded[0].amount = 1;
        setCart([...cart, productAdded[0]]);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  React.useEffect(() => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
  }, [cart]);

  const removeProduct = (productId: number) => {
    try {
      if (!cart.filter((cartItem) => cartItem.id == productId).length) {
        throw new Error();
      }
      setCart(cart.filter((cartItem) => cartItem.id != productId));
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const alreadyInCart = cart.filter((cartItem) => cartItem.id == productId);

      //check stock
      const stockItem = await api.get(`/stock/${productId}`);

      if (stockItem && stockItem.data.amount < amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      cart[cart.indexOf(alreadyInCart[0])].amount = amount;

      setCart([...cart]);
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  async function loadProducts() {
    const response = await api.get("/products");
    console.log("chamou esta merda");

    setProducts(response.data);
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        addProduct,
        removeProduct,
        updateProductAmount,
        loadProducts,
        products,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
