import { useRouter } from 'next/router'
import { ImageContainer, ProductContainer, ProductDetails } from '@/src/styles/pages/product'
import { GetStaticPaths, GetStaticProps } from 'next'
import { stripe } from '@/src/lib/stripe'
import Stripe from 'stripe'
import Image from 'next/image'
import axios from 'axios'
import { useState } from 'react'
import Head from 'next/head'

interface ProductProps {
  product: {
    id: string
    name: string
    imageUrl: string
    price: string
    description: string
    defaultPriceId: string
  }
}

export default function Product({ product }: ProductProps) {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false)
  const { isFallback } = useRouter()

  if (isFallback) {
    return <p>loading</p>
  }

  async function handleBuyProduct() {
    try {
      setIsCreatingCheckout(true)
      const response = await axios.post('/api/checkout', {
        priceId: product.defaultPriceId,
      })

      const { checkoutUrl } = response.data

      window.location.href = checkoutUrl
    } catch (error) {
      setIsCreatingCheckout(false)
      alert('falha ao redirecionar o checkout')
    }
  }

  return (
    <>
      <Head>
        <title>Camiseta</title>

        <meta name="robots" content="noindex"/>
      </Head>
      <ProductContainer>
        <ImageContainer>
          <Image src={product.imageUrl} width={520} height={480} alt="" />
        </ImageContainer>

        <ProductDetails>
          <h1>{product.name}</h1>
          <span>{product.price}</span>

          <p>{product.description}</p>

          <button onClick={handleBuyProduct} disabled={isCreatingCheckout}>
            Comprar agora
          </button>
        </ProductDetails>
      </ProductContainer>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async (): Promise<any> => {
  return {
    paths: [
      {
        params: { id: 'prod_OxpYpDg4YEp2Y5' },
      },
    ],
    fallback: 'blocking',
  }
}

export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {
  const productId = String(params?.id)

  const product = await stripe.products.retrieve(productId, {
    expand: ['default_price'],
  })

  const price = product.default_price as Stripe.Price

  const newProduct = {
    id: product.id,
    name: product.name,
    imageUrl: product.images[0],
    price: new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format((price.unit_amount || 0) / 100),
    description: product.description,
    defaultPriceId: price.id,
  }
  return {
    props: { product: newProduct },
    revalidate: 60 * 60 * 1,
  }
}
