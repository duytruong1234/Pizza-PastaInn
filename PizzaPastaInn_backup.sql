--
-- PostgreSQL database dump
--

\restrict mjkZkJTbBiUVo2QTnl0sYxjBIUhGI34JLPsXpj027g3z4TDzSBR7ctPNLQpzN1N

-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

-- Started on 2026-06-29 06:04:04

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 217 (class 1259 OID 150310)
-- Name: cart_item_combos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_item_combos (
    cart_item_combo_id integer NOT NULL,
    cart_item_id integer,
    group_id character varying(50),
    dish_price_id character varying(100),
    is_half_half boolean,
    cart_combo_note text
);


ALTER TABLE public.cart_item_combos OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 150313)
-- Name: cart_item_combos_cart_item_combo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_item_combos_cart_item_combo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_item_combos_cart_item_combo_id_seq OWNER TO postgres;

--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 218
-- Name: cart_item_combos_cart_item_combo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_item_combos_cart_item_combo_id_seq OWNED BY public.cart_item_combos.cart_item_combo_id;


--
-- TOC entry 219 (class 1259 OID 150314)
-- Name: cart_item_half; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_item_half (
    cart_item_half_id integer NOT NULL,
    cart_item_id integer,
    cart_item_combo_id integer,
    dish_id integer,
    cart_half_note text
);


ALTER TABLE public.cart_item_half OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 150317)
-- Name: cart_item_half_cart_item_half_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_item_half_cart_item_half_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_item_half_cart_item_half_id_seq OWNER TO postgres;

--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 220
-- Name: cart_item_half_cart_item_half_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_item_half_cart_item_half_id_seq OWNED BY public.cart_item_half.cart_item_half_id;


--
-- TOC entry 221 (class 1259 OID 150318)
-- Name: cart_item_topping; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_item_topping (
    item_topping_id integer NOT NULL,
    cart_item_id integer,
    cart_item_combo_id integer,
    cart_item_half_id integer,
    topping_id integer,
    quantity integer
);


ALTER TABLE public.cart_item_topping OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 150321)
-- Name: cart_item_topping_item_topping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_item_topping_item_topping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_item_topping_item_topping_id_seq OWNER TO postgres;

--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 222
-- Name: cart_item_topping_item_topping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_item_topping_item_topping_id_seq OWNED BY public.cart_item_topping.item_topping_id;


--
-- TOC entry 223 (class 1259 OID 150322)
-- Name: cart_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cart_items (
    cart_item_id integer NOT NULL,
    cart_id integer,
    dish_price_id character varying(100),
    combo_id integer,
    quantity integer,
    is_half_half boolean,
    price_cart integer,
    cart_item_note text
);


ALTER TABLE public.cart_items OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 150327)
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cart_items_cart_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_cart_item_id_seq OWNER TO postgres;

--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 224
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cart_items_cart_item_id_seq OWNED BY public.cart_items.cart_item_id;


--
-- TOC entry 225 (class 1259 OID 150328)
-- Name: carts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.carts (
    cart_id integer NOT NULL,
    user_id integer,
    created_at timestamp(6) with time zone,
    total_price_cart integer
);


ALTER TABLE public.carts OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 150331)
-- Name: carts_cart_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.carts_cart_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.carts_cart_id_seq OWNER TO postgres;

--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 226
-- Name: carts_cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.carts_cart_id_seq OWNED BY public.carts.cart_id;


--
-- TOC entry 227 (class 1259 OID 150332)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    category_id integer NOT NULL,
    category_name character varying(50) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 150335)
-- Name: categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_category_id_seq OWNER TO postgres;

--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_category_id_seq OWNED BY public.categories.category_id;


--
-- TOC entry 229 (class 1259 OID 150336)
-- Name: chat_rooms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.chat_rooms (
    room_id integer NOT NULL,
    customer_id integer,
    guest_session_id character varying(100),
    guest_name character varying(100),
    guest_phone character varying(20),
    guest_address text,
    room_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chat_rooms_room_status_check CHECK (((room_status)::text = ANY (ARRAY[('pending'::character varying)::text, ('active'::character varying)::text, ('closed'::character varying)::text])))
);


ALTER TABLE public.chat_rooms OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 150345)
-- Name: chat_rooms_room_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.chat_rooms_room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.chat_rooms_room_id_seq OWNER TO postgres;

--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 230
-- Name: chat_rooms_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.chat_rooms_room_id_seq OWNED BY public.chat_rooms.room_id;


--
-- TOC entry 231 (class 1259 OID 150346)
-- Name: combo_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combo_groups (
    group_id character varying(50) NOT NULL,
    combo_id integer,
    group_name text NOT NULL,
    min_select integer DEFAULT 1,
    max_select integer DEFAULT 1
);


ALTER TABLE public.combo_groups OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 150353)
-- Name: combo_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combo_items (
    combo_item_id integer NOT NULL,
    group_id character varying(50),
    dish_price_id character varying(100),
    price_extra integer DEFAULT 0
);


ALTER TABLE public.combo_items OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 150357)
-- Name: combo_items_combo_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.combo_items_combo_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.combo_items_combo_item_id_seq OWNER TO postgres;

--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 233
-- Name: combo_items_combo_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.combo_items_combo_item_id_seq OWNED BY public.combo_items.combo_item_id;


--
-- TOC entry 234 (class 1259 OID 150358)
-- Name: combos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.combos (
    combo_id integer NOT NULL,
    combo_name character varying(100) NOT NULL,
    combo_price integer NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    category_id integer,
    image_combo text
);


ALTER TABLE public.combos OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 150364)
-- Name: combos_combo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.combos_combo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.combos_combo_id_seq OWNER TO postgres;

--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 235
-- Name: combos_combo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.combos_combo_id_seq OWNED BY public.combos.combo_id;


--
-- TOC entry 236 (class 1259 OID 150365)
-- Name: crusts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.crusts (
    crust_id integer NOT NULL,
    crust_name character varying(50) NOT NULL,
    is_visible boolean DEFAULT true
);


ALTER TABLE public.crusts OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 150369)
-- Name: crusts_crust_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.crusts_crust_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.crusts_crust_id_seq OWNER TO postgres;

--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 237
-- Name: crusts_crust_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.crusts_crust_id_seq OWNED BY public.crusts.crust_id;


--
-- TOC entry 238 (class 1259 OID 150370)
-- Name: dish_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dish_prices (
    dish_price_id character varying(100) NOT NULL,
    dish_id integer,
    size_id integer,
    crust_id integer,
    dish_price integer DEFAULT 0
);


ALTER TABLE public.dish_prices OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 150374)
-- Name: dishes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dishes (
    dish_id integer NOT NULL,
    category_id integer,
    dish_name character varying(100) NOT NULL,
    image text,
    ingredient text,
    dish_status boolean
);


ALTER TABLE public.dishes OWNER TO postgres;

--
-- TOC entry 240 (class 1259 OID 150379)
-- Name: dishes_dish_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.dishes_dish_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.dishes_dish_id_seq OWNER TO postgres;

--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 240
-- Name: dishes_dish_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.dishes_dish_id_seq OWNED BY public.dishes.dish_id;


--
-- TOC entry 241 (class 1259 OID 150380)
-- Name: message_images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.message_images (
    image_id integer NOT NULL,
    message_id integer NOT NULL,
    image_url character varying(255) NOT NULL,
    uploaded_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.message_images OWNER TO postgres;

--
-- TOC entry 242 (class 1259 OID 150384)
-- Name: message_images_image_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.message_images_image_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.message_images_image_id_seq OWNER TO postgres;

--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 242
-- Name: message_images_image_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.message_images_image_id_seq OWNED BY public.message_images.image_id;


--
-- TOC entry 243 (class 1259 OID 150385)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    message_id integer NOT NULL,
    room_id integer NOT NULL,
    sender_type character varying(20) NOT NULL,
    sender_id integer,
    message_text text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT messages_sender_type_check CHECK (((sender_type)::text = ANY (ARRAY[('customer'::character varying)::text, ('admin'::character varying)::text])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 244 (class 1259 OID 150393)
-- Name: messages_message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_message_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_message_id_seq OWNER TO postgres;

--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 244
-- Name: messages_message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_message_id_seq OWNED BY public.messages.message_id;


--
-- TOC entry 245 (class 1259 OID 150394)
-- Name: order_item_combos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item_combos (
    order_item_combo_id integer NOT NULL,
    order_item_id integer,
    group_id character varying(50),
    dish_price_id character varying(100),
    is_half_half boolean,
    order_combo_note text
);


ALTER TABLE public.order_item_combos OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 150399)
-- Name: order_item_combos_order_item_combo_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_combos_order_item_combo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_combos_order_item_combo_id_seq OWNER TO postgres;

--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 246
-- Name: order_item_combos_order_item_combo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_combos_order_item_combo_id_seq OWNED BY public.order_item_combos.order_item_combo_id;


--
-- TOC entry 247 (class 1259 OID 150400)
-- Name: order_item_half; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item_half (
    order_item_half_id integer NOT NULL,
    order_item_id integer,
    order_item_combo_id integer,
    dish_id integer,
    order_half_note text
);


ALTER TABLE public.order_item_half OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 150405)
-- Name: order_item_half_order_item_half_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_half_order_item_half_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_half_order_item_half_id_seq OWNER TO postgres;

--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 248
-- Name: order_item_half_order_item_half_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_half_order_item_half_id_seq OWNED BY public.order_item_half.order_item_half_id;


--
-- TOC entry 249 (class 1259 OID 150406)
-- Name: order_item_toppings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item_toppings (
    order_item_topping_id integer NOT NULL,
    order_item_id integer,
    order_item_combo_id integer,
    order_item_half_id integer,
    topping_id integer,
    quantity integer,
    topping_price integer
);


ALTER TABLE public.order_item_toppings OWNER TO postgres;

--
-- TOC entry 250 (class 1259 OID 150409)
-- Name: order_item_toppings_order_item_topping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_toppings_order_item_topping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_toppings_order_item_topping_id_seq OWNER TO postgres;

--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 250
-- Name: order_item_toppings_order_item_topping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_toppings_order_item_topping_id_seq OWNED BY public.order_item_toppings.order_item_topping_id;


--
-- TOC entry 251 (class 1259 OID 150410)
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    order_id integer,
    dish_price_id character varying(100),
    combo_id integer,
    quantity integer,
    is_half_half boolean,
    order_price integer,
    order_item_note text
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- TOC entry 252 (class 1259 OID 150415)
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_order_item_id_seq OWNER TO postgres;

--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 252
-- Name: order_items_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;


--
-- TOC entry 253 (class 1259 OID 150416)
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    user_id integer,
    payment_method character varying(50),
    payment_status character varying(50),
    total_price_dish integer,
    shipping_fee integer,
    discount_amount integer,
    total_order integer,
    order_note text,
    created_at timestamp(6) with time zone,
    order_status character varying(50),
    shipped_at timestamp(6) with time zone,
    estimated_delivery_time timestamp(6) with time zone,
    arrived_at timestamp(6) with time zone,
    completed_at timestamp(6) with time zone,
    order_type character varying(50),
    pickup_time timestamp(6) with time zone,
    customer_name character varying(255),
    customer_phone character varying(20),
    customer_email character varying(255),
    cancelled_at timestamp(6) with time zone,
    confirmed_at timestamp(6) with time zone,
    customer_latitude numeric(10,7),
    customer_longitude numeric(10,7),
    preparing_at timestamp(6) with time zone,
    shipping_distance_meters numeric(65,30),
    store_id integer,
    user_address_id integer
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- TOC entry 254 (class 1259 OID 150421)
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_id_seq OWNER TO postgres;

--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 254
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- TOC entry 255 (class 1259 OID 150422)
-- Name: policy_chapters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy_chapters (
    id character varying(100) NOT NULL,
    chapter_name character varying(255) NOT NULL,
    last_updated date NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.policy_chapters OWNER TO postgres;

--
-- TOC entry 256 (class 1259 OID 150426)
-- Name: policy_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy_sections (
    id integer NOT NULL,
    chapter_id character varying(100),
    section_number character varying(50) NOT NULL,
    title_section character varying(255) NOT NULL,
    display_order integer DEFAULT 0
);


ALTER TABLE public.policy_sections OWNER TO postgres;

--
-- TOC entry 257 (class 1259 OID 150430)
-- Name: policy_sections_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.policy_sections_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.policy_sections_id_seq OWNER TO postgres;

--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 257
-- Name: policy_sections_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.policy_sections_id_seq OWNED BY public.policy_sections.id;


--
-- TOC entry 258 (class 1259 OID 150431)
-- Name: policy_sub_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.policy_sub_item (
    id integer NOT NULL,
    section_id integer,
    item_number character varying(50),
    content text NOT NULL,
    display_order integer DEFAULT 0
);


ALTER TABLE public.policy_sub_item OWNER TO postgres;

--
-- TOC entry 259 (class 1259 OID 150437)
-- Name: policy_sub_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.policy_sub_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.policy_sub_item_id_seq OWNER TO postgres;

--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 259
-- Name: policy_sub_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.policy_sub_item_id_seq OWNED BY public.policy_sub_item.id;


--
-- TOC entry 260 (class 1259 OID 150438)
-- Name: shop_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.shop_reviews (
    review_id integer NOT NULL,
    user_id integer,
    order_id integer,
    rating_star integer,
    comment text,
    image_url text,
    shop_reply text,
    created_at timestamp(6) with time zone,
    is_visible boolean
);


ALTER TABLE public.shop_reviews OWNER TO postgres;

--
-- TOC entry 261 (class 1259 OID 150443)
-- Name: shop_reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.shop_reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shop_reviews_review_id_seq OWNER TO postgres;

--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 261
-- Name: shop_reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.shop_reviews_review_id_seq OWNED BY public.shop_reviews.review_id;


--
-- TOC entry 262 (class 1259 OID 150444)
-- Name: sizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sizes (
    size_id integer NOT NULL,
    size_name character varying(50) NOT NULL,
    is_visible boolean DEFAULT true
);


ALTER TABLE public.sizes OWNER TO postgres;

--
-- TOC entry 263 (class 1259 OID 150448)
-- Name: sizes_size_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sizes_size_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sizes_size_id_seq OWNER TO postgres;

--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 263
-- Name: sizes_size_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sizes_size_id_seq OWNED BY public.sizes.size_id;


--
-- TOC entry 264 (class 1259 OID 150449)
-- Name: stores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stores (
    store_id integer NOT NULL,
    store_name character varying(255),
    address text,
    latitude numeric,
    longitude numeric,
    hotline character varying(100),
    is_active boolean
);


ALTER TABLE public.stores OWNER TO postgres;

--
-- TOC entry 265 (class 1259 OID 150454)
-- Name: stores_store_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.stores_store_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stores_store_id_seq OWNER TO postgres;

--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 265
-- Name: stores_store_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.stores_store_id_seq OWNED BY public.stores.store_id;


--
-- TOC entry 273 (class 1259 OID 150741)
-- Name: tb_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tb_transactions (
    id integer NOT NULL,
    gateway character varying(100) NOT NULL,
    transaction_date timestamp(6) with time zone,
    account_number character varying(100),
    sub_account character varying(250),
    amount_in numeric(20,2) DEFAULT 0.00 NOT NULL,
    amount_out numeric(20,2) DEFAULT 0.00 NOT NULL,
    accumulated numeric(20,2) DEFAULT 0.00 NOT NULL,
    code character varying(250),
    transaction_content text,
    reference_number character varying(255),
    body text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    order_id integer
);


ALTER TABLE public.tb_transactions OWNER TO postgres;

--
-- TOC entry 272 (class 1259 OID 150740)
-- Name: tb_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tb_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tb_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 272
-- Name: tb_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tb_transactions_id_seq OWNED BY public.tb_transactions.id;


--
-- TOC entry 266 (class 1259 OID 150455)
-- Name: toppings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.toppings (
    topping_id integer NOT NULL,
    topping_name character varying(50) NOT NULL,
    price_topping integer DEFAULT 0,
    size_id integer,
    is_for_pizza boolean DEFAULT true,
    is_for_spaghetti boolean DEFAULT true
);


ALTER TABLE public.toppings OWNER TO postgres;

--
-- TOC entry 267 (class 1259 OID 150461)
-- Name: toppings_topping_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.toppings_topping_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.toppings_topping_id_seq OWNER TO postgres;

--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 267
-- Name: toppings_topping_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.toppings_topping_id_seq OWNED BY public.toppings.topping_id;


--
-- TOC entry 268 (class 1259 OID 150462)
-- Name: user_address; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_address (
    user_address_id integer NOT NULL,
    user_id integer,
    address_line text,
    is_default boolean
);


ALTER TABLE public.user_address OWNER TO postgres;

--
-- TOC entry 269 (class 1259 OID 150467)
-- Name: user_address_user_address_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_address_user_address_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_address_user_address_id_seq OWNER TO postgres;

--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 269
-- Name: user_address_user_address_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_address_user_address_id_seq OWNED BY public.user_address.user_address_id;


--
-- TOC entry 270 (class 1259 OID 150468)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    username character varying(100),
    email character varying(100),
    phone character varying(20),
    password character varying(255),
    role character varying(50),
    user_status boolean,
    created_at timestamp(6) with time zone,
    google_id character varying(255),
    auth_provider character varying(50) DEFAULT 'local'::character varying,
    avatar character varying(255),
    is_guest boolean DEFAULT false
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 271 (class 1259 OID 150474)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 271
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4884 (class 2604 OID 150475)
-- Name: cart_item_combos cart_item_combo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_combos ALTER COLUMN cart_item_combo_id SET DEFAULT nextval('public.cart_item_combos_cart_item_combo_id_seq'::regclass);


--
-- TOC entry 4885 (class 2604 OID 150476)
-- Name: cart_item_half cart_item_half_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_half ALTER COLUMN cart_item_half_id SET DEFAULT nextval('public.cart_item_half_cart_item_half_id_seq'::regclass);


--
-- TOC entry 4886 (class 2604 OID 150477)
-- Name: cart_item_topping item_topping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_topping ALTER COLUMN item_topping_id SET DEFAULT nextval('public.cart_item_topping_item_topping_id_seq'::regclass);


--
-- TOC entry 4887 (class 2604 OID 150478)
-- Name: cart_items cart_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN cart_item_id SET DEFAULT nextval('public.cart_items_cart_item_id_seq'::regclass);


--
-- TOC entry 4888 (class 2604 OID 150479)
-- Name: carts cart_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts ALTER COLUMN cart_id SET DEFAULT nextval('public.carts_cart_id_seq'::regclass);


--
-- TOC entry 4889 (class 2604 OID 150480)
-- Name: categories category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN category_id SET DEFAULT nextval('public.categories_category_id_seq'::regclass);


--
-- TOC entry 4890 (class 2604 OID 150481)
-- Name: chat_rooms room_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms ALTER COLUMN room_id SET DEFAULT nextval('public.chat_rooms_room_id_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 150482)
-- Name: combo_items combo_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_items ALTER COLUMN combo_item_id SET DEFAULT nextval('public.combo_items_combo_item_id_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 150483)
-- Name: combos combo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos ALTER COLUMN combo_id SET DEFAULT nextval('public.combos_combo_id_seq'::regclass);


--
-- TOC entry 4900 (class 2604 OID 150484)
-- Name: crusts crust_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crusts ALTER COLUMN crust_id SET DEFAULT nextval('public.crusts_crust_id_seq'::regclass);


--
-- TOC entry 4903 (class 2604 OID 150485)
-- Name: dishes dish_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes ALTER COLUMN dish_id SET DEFAULT nextval('public.dishes_dish_id_seq'::regclass);


--
-- TOC entry 4904 (class 2604 OID 150486)
-- Name: message_images image_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_images ALTER COLUMN image_id SET DEFAULT nextval('public.message_images_image_id_seq'::regclass);


--
-- TOC entry 4906 (class 2604 OID 150487)
-- Name: messages message_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN message_id SET DEFAULT nextval('public.messages_message_id_seq'::regclass);


--
-- TOC entry 4909 (class 2604 OID 150488)
-- Name: order_item_combos order_item_combo_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_combos ALTER COLUMN order_item_combo_id SET DEFAULT nextval('public.order_item_combos_order_item_combo_id_seq'::regclass);


--
-- TOC entry 4910 (class 2604 OID 150489)
-- Name: order_item_half order_item_half_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_half ALTER COLUMN order_item_half_id SET DEFAULT nextval('public.order_item_half_order_item_half_id_seq'::regclass);


--
-- TOC entry 4911 (class 2604 OID 150490)
-- Name: order_item_toppings order_item_topping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_toppings ALTER COLUMN order_item_topping_id SET DEFAULT nextval('public.order_item_toppings_order_item_topping_id_seq'::regclass);


--
-- TOC entry 4912 (class 2604 OID 150491)
-- Name: order_items order_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);


--
-- TOC entry 4913 (class 2604 OID 150492)
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- TOC entry 4915 (class 2604 OID 150493)
-- Name: policy_sections id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_sections ALTER COLUMN id SET DEFAULT nextval('public.policy_sections_id_seq'::regclass);


--
-- TOC entry 4917 (class 2604 OID 150494)
-- Name: policy_sub_item id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_sub_item ALTER COLUMN id SET DEFAULT nextval('public.policy_sub_item_id_seq'::regclass);


--
-- TOC entry 4919 (class 2604 OID 150495)
-- Name: shop_reviews review_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_reviews ALTER COLUMN review_id SET DEFAULT nextval('public.shop_reviews_review_id_seq'::regclass);


--
-- TOC entry 4920 (class 2604 OID 150496)
-- Name: sizes size_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sizes ALTER COLUMN size_id SET DEFAULT nextval('public.sizes_size_id_seq'::regclass);


--
-- TOC entry 4922 (class 2604 OID 150497)
-- Name: stores store_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores ALTER COLUMN store_id SET DEFAULT nextval('public.stores_store_id_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 150744)
-- Name: tb_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_transactions ALTER COLUMN id SET DEFAULT nextval('public.tb_transactions_id_seq'::regclass);


--
-- TOC entry 4923 (class 2604 OID 150498)
-- Name: toppings topping_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.toppings ALTER COLUMN topping_id SET DEFAULT nextval('public.toppings_topping_id_seq'::regclass);


--
-- TOC entry 4927 (class 2604 OID 150499)
-- Name: user_address user_address_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_address ALTER COLUMN user_address_id SET DEFAULT nextval('public.user_address_user_address_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 150500)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5187 (class 0 OID 150310)
-- Dependencies: 217
-- Data for Name: cart_item_combos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_item_combos (cart_item_combo_id, cart_item_id, group_id, dish_price_id, is_half_half, cart_combo_note) FROM stdin;
\.


--
-- TOC entry 5189 (class 0 OID 150314)
-- Dependencies: 219
-- Data for Name: cart_item_half; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_item_half (cart_item_half_id, cart_item_id, cart_item_combo_id, dish_id, cart_half_note) FROM stdin;
\.


--
-- TOC entry 5191 (class 0 OID 150318)
-- Dependencies: 221
-- Data for Name: cart_item_topping; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_item_topping (item_topping_id, cart_item_id, cart_item_combo_id, cart_item_half_id, topping_id, quantity) FROM stdin;
\.


--
-- TOC entry 5193 (class 0 OID 150322)
-- Dependencies: 223
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cart_items (cart_item_id, cart_id, dish_price_id, combo_id, quantity, is_half_half, price_cart, cart_item_note) FROM stdin;
\.


--
-- TOC entry 5195 (class 0 OID 150328)
-- Dependencies: 225
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.carts (cart_id, user_id, created_at, total_price_cart) FROM stdin;
1	\N	2026-06-09 04:06:50.869+07	0
2	\N	2026-06-09 04:44:27.967+07	0
10	\N	2026-06-23 20:04:21.788+07	0
11	\N	2026-06-23 20:28:53.943+07	0
12	\N	2026-06-28 19:26:21.354+07	0
3	5	2026-06-09 13:06:50.209+07	0
4	6	2026-06-22 19:12:03.003+07	0
5	6	2026-06-22 19:15:34.801+07	0
6	\N	2026-06-23 19:29:56.406+07	0
7	7	2026-06-23 19:35:13.787+07	0
8	\N	2026-06-23 19:47:40.88+07	0
9	\N	2026-06-23 19:51:53.202+07	0
\.


--
-- TOC entry 5197 (class 0 OID 150332)
-- Dependencies: 227
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (category_id, category_name) FROM stdin;
1	Pizza
2	Gratin / Risotto
3	Spaghetti
4	Salad / Side Dish
5	Drink
7	Combo
\.


--
-- TOC entry 5199 (class 0 OID 150336)
-- Dependencies: 229
-- Data for Name: chat_rooms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.chat_rooms (room_id, customer_id, guest_session_id, guest_name, guest_phone, guest_address, room_status, created_at, updated_at) FROM stdin;
1	5	\N	\N	\N	\N	pending	2026-06-10 20:04:21.38+07	2026-06-10 20:04:28.781+07
2	\N	guest_test_500	Test	0123456789	A	pending	2026-06-23 19:09:32.442+07	2026-06-23 19:09:32.442+07
4	6	\N	\N	\N	\N	active	2026-06-23 20:35:42.135+07	2026-06-23 20:36:02.268+07
\.


--
-- TOC entry 5201 (class 0 OID 150346)
-- Dependencies: 231
-- Data for Name: combo_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.combo_groups (group_id, combo_id, group_name, min_select, max_select) FROM stdin;
cg_1_7vgzdsn	1	2 Pepsi	2	2
cg_1_b9m2cu1	1	1 Meat Grantin	1	1
cg_1_pxi4i43	1	1 Super Supreme Pizza Regular Size with Cheese Crust	1	1
cg_1_y3qv93l	1	2 Pieces Garlic Bread	1	1
cg_2_vjwsbqr	2	1 Gold Pizza Regular Size with Cheese Crust	1	1
cg_2_whvq8o9	2	2 Pieces Gralic Bread	1	1
cg_2_52lzjz9	2	2 Pepsi	2	2
cg_2_oitvjjp	2	1 Meat Grantin	1	1
cg_3_uqd3gsq	3	1 Gold Pizza Regular Size with Cheese Crust	1	1
cg_3_bhx1gpw	3	2 Pepsi	2	2
cg_3_q6dc4m9	3	BBQ Wing 10 Pieces	1	1
cg_4_4qb4wjl	4	Choose 1 Pizza Regular Size	1	1
cg_4_1fes9fw	4	Choose Salad or BBQ Wing ( 10 pieces )	1	1
cg_4_1xpkq70	4	Free Garilc Bread 4 Pieces	1	1
cg_4_4ym8x3u	4	Pepsi 2 can	2	2
cg_5_fccl8kj	5	Free Garlic Bread 8 Pieces	1	1
cg_5_0vc1giw	5	Choose 1 Pizza Large Size	1	1
cg_5_rydbdid	5	Choose Pepsi 4 can or 1 Pepsi 1,5L	1	1
cg_5_2tbhv8l	5	Choose Salad or BBQ Wing ( 10 pieces )	1	1
cg_5_0a5e76g	5	Choose 1 Spaghetti or Grantin or Risotto	1	1
\.


--
-- TOC entry 5202 (class 0 OID 150353)
-- Dependencies: 232
-- Data for Name: combo_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.combo_items (combo_item_id, group_id, dish_price_id, price_extra) FROM stdin;
264	cg_1_7vgzdsn	PEPSI	0
265	cg_1_b9m2cu1	MEAT_G	0
266	cg_1_pxi4i43	CH_SUPER_R	0
267	cg_1_y3qv93l	GB_2M	0
272	cg_3_uqd3gsq	CH_GOLD_R	0
273	cg_3_bhx1gpw	PEPSI	0
274	cg_3_q6dc4m9	WING_L	0
275	cg_4_4qb4wjl	CH_HH_R	0
276	cg_4_4qb4wjl	HAM_HH_R	0
277	cg_4_4qb4wjl	TEXAS_R_P	0
278	cg_4_4qb4wjl	BBQ_R_P	0
279	cg_4_4qb4wjl	KIMCHI_R_P	0
280	cg_4_4qb4wjl	TUNA_R_P	0
281	cg_4_4qb4wjl	SUPER_R_P	0
282	cg_4_4qb4wjl	POTATO_R_P	0
283	cg_4_4qb4wjl	HOT_R_P	0
284	cg_4_4qb4wjl	GOLD_R_P	0
285	cg_4_4qb4wjl	HAW_R_P	0
286	cg_4_4qb4wjl	VEG_R_P	0
287	cg_4_4qb4wjl	SEA_R_P	0
288	cg_4_4qb4wjl	PP_R_P	0
289	cg_4_4qb4wjl	DE_R_P	0
290	cg_4_4qb4wjl	HH_R_P	0
291	cg_4_4qb4wjl	HH_R_T	0
292	cg_4_1fes9fw	WING_L	0
293	cg_4_1fes9fw	SALAD_A	0
294	cg_4_1fes9fw	SALAD_B	0
295	cg_4_1xpkq70	GB_4M	0
296	cg_4_4ym8x3u	PEPSI	0
268	cg_2_vjwsbqr	CH_GOLD_R	0
269	cg_2_whvq8o9	GB_2M	0
270	cg_2_52lzjz9	PEPSI	0
271	cg_2_oitvjjp	MEAT_G	0
297	cg_5_fccl8kj	GB_8M	0
298	cg_5_0vc1giw	TEXAS_L_P	0
299	cg_5_0vc1giw	BBQ_L_P	0
300	cg_5_0vc1giw	KIMCHI_L_P	0
301	cg_5_0vc1giw	TUNA_L_P	0
302	cg_5_0vc1giw	SUPER_L_P	0
303	cg_5_0vc1giw	POTATO_L_P	0
304	cg_5_0vc1giw	HOT_L_P	0
305	cg_5_0vc1giw	GOLD_L_P	0
306	cg_5_0vc1giw	HAW_L_P	0
307	cg_5_0vc1giw	VEG_L_P	0
308	cg_5_0vc1giw	SEA_L_P	0
309	cg_5_0vc1giw	PP_L_P	0
310	cg_5_0vc1giw	DE_L_P	0
311	cg_5_0vc1giw	CH_HH_L	0
312	cg_5_0vc1giw	HAM_HH_L	0
313	cg_5_0vc1giw	HH_L_P	0
314	cg_5_0vc1giw	HH_LL_T	0
315	cg_5_rydbdid	PEPSI	0
316	cg_5_rydbdid	PEPSI_15L	0
317	cg_5_2tbhv8l	SALAD_B	0
318	cg_5_2tbhv8l	SALAD_A	0
319	cg_5_2tbhv8l	WING_L	0
320	cg_5_0a5e76g	MEAT_S	0
321	cg_5_0a5e76g	MEAT_G	0
322	cg_5_0a5e76g	MEAT_R	0
323	cg_5_0a5e76g	CK_R_S	0
324	cg_5_0a5e76g	CK_R_G	0
325	cg_5_0a5e76g	CK_R_R	0
326	cg_5_0a5e76g	CK_W_S	0
327	cg_5_0a5e76g	CK_W_G	0
328	cg_5_0a5e76g	CK_W_R	0
329	cg_5_0a5e76g	SEA_R_S	0
330	cg_5_0a5e76g	SEA_R_G	0
331	cg_5_0a5e76g	SEA_R_R	0
332	cg_5_0a5e76g	SEA_W_S	0
333	cg_5_0a5e76g	SEA_W_G	0
334	cg_5_0a5e76g	SEA_W_R	0
335	cg_5_0a5e76g	HOT_S	0
336	cg_5_0a5e76g	HOT_G	0
337	cg_5_0a5e76g	HOT_R	0
338	cg_5_0a5e76g	CAR_S	0
339	cg_5_0a5e76g	CAR_G	0
340	cg_5_0a5e76g	CAR_R	0
341	cg_5_0a5e76g	NA_S	0
342	cg_5_0a5e76g	NA_G	0
343	cg_5_0a5e76g	NA_R	0
344	cg_5_0a5e76g	KIMCHI_G	0
345	cg_5_0a5e76g	KIMCHI_R	0
346	cg_5_0a5e76g	DO_G	0
347	cg_5_0a5e76g	DO_R	0
\.


--
-- TOC entry 5204 (class 0 OID 150358)
-- Dependencies: 234
-- Data for Name: combos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.combos (combo_id, combo_name, combo_price, description, is_active, category_id, image_combo) FROM stdin;
1	Combo A	395000	1 Super Supreme Pizza Regular Size with Cheese Crust, 1 Meat Grantin, 2 Pieces Garlic Bread, 2 Pepsi	t	7	/uploads/dishes/dish_1782686525390.jpg
2	Combo B	390000	1 Gold Pizza Regular Size with Cheese Crust, 1 Meat Grantin, 2 Pieces Gralic Bread, 2 Pepsi	t	7	/uploads/dishes/dish_1782686535088.jpg
3	Combo C	395000	1 Gold Pizza Regular Size with Cheese Crust, BBQ Wing 10 Pieces, 2 Pepsi	t	7	/uploads/dishes/dish_1782686541620.jpg
4	Happy Meal	445000	Choose 1 Pizza Regular Size, Choose Salad or BBQ Wing ( 10 pieces ), Free Garilc Bread 4 Pieces, Pepsi 2 can	t	7	/uploads/dishes/dish_1782686548350.jpg
5	Happy Family	735000	Choose 1 Pizza Large Size, Choose Salad or BBQ Wing ( 10 pieces ), Choose 1 Spaghetti or Grantin or Risotto, Free Garlic Bread 8 Pieces, Choose Pepsi 4 can or 1 Pepsi 1,5L	t	7	/uploads/dishes/dish_1782686560580.jpg
\.


--
-- TOC entry 5206 (class 0 OID 150365)
-- Dependencies: 236
-- Data for Name: crusts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.crusts (crust_id, crust_name, is_visible) FROM stdin;
1	Pan Crust	t
2	Thin Crust	t
3	Cheese Crust	t
4	Ham Crust	t
5	None	f
\.


--
-- TOC entry 5208 (class 0 OID 150370)
-- Dependencies: 238
-- Data for Name: dish_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dish_prices (dish_price_id, dish_id, size_id, crust_id, dish_price) FROM stdin;
TEXAS_R_T	1	1	2	245000
TEXAS_L_T	1	2	2	355000
CH_TEXAS_R	1	1	3	255000
HAM_TEXAS_R	1	1	4	255000
CH_TEXAS_L	1	2	3	365000
HAM_TEXAS_L	1	2	4	365000
BBQ_L_P	2	2	1	355000
BBQ_L_T	2	2	2	355000
CH_BBQ_R	2	1	3	255000
HAM_BBQ_R	2	1	4	255000
CH_BBQ_L	2	2	3	365000
HAM_BBQ_L	2	2	4	365000
KIMCHI_L_P	3	2	1	300000
KIMCHI_L_T	3	2	2	300000
CH_KIMCHI_R	3	1	3	220000
HAM_KIMCHI_R	3	1	4	220000
CH_KIMCHI_L	3	2	3	315000
HAM_KIMCHI_L	3	2	4	315000
TUNA_L_P	4	2	1	300000
TUNA_L_T	4	2	2	300000
CH_TUNA_R	4	1	3	220000
HAM_TUNA_R	4	1	4	220000
CH_TUNA_L	4	2	3	315000
HAM_TUNA_L	4	2	4	315000
POTATO_L_P	6	2	1	300000
POTATO_L_T	6	2	2	300000
CH_POTATO_R	6	1	3	220000
HAM_POTATO_R	6	1	4	220000
CH_POTATO_L	6	2	3	315000
HAM_POTATO_L	6	2	4	315000
HOT_L_P	7	2	1	300000
HOT_L_T	7	2	2	300000
CH_HOT_R	7	1	3	220000
HAM_HOT_R	7	1	4	220000
CH_HOT_L	7	2	3	315000
HAM_HOT_L	7	2	4	315000
GOLD_L_P	8	2	1	300000
GOLD_L_T	8	2	2	300000
CH_GOLD_R	8	1	3	220000
HAM_GOLD_R	8	1	4	220000
CH_GOLD_L	8	2	3	315000
HAM_GOLD_L	8	2	4	315000
HAM_SUPER_L	5	2	4	330000
HAM_SUPER_R	5	1	4	230000
SUPER_L_P	5	2	1	310000
SUPER_L_T	5	2	2	310000
SUPER_R_P	5	1	1	210000
SUPER_R_T	5	1	2	210000
GB_4M	62	3	5	0
GB_8M	63	3	5	0
GB_2M	64	3	5	0
HAM_HH_R	65	1	4	0
HH_R_P	65	1	1	0
HH_R_T	65	1	2	0
CH_HH_L	65	2	3	0
HAM_HH_L	65	2	4	0
HH_L_P	65	2	1	0
HH_LL_T	65	2	2	0
CH_HH_R	65	1	3	0
CH_PP_R	12	1	3	230000
DE_L_P	13	2	1	310000
DE_L_T	13	2	2	310000
DE_R_P	13	1	1	210000
DE_R_T	13	1	2	210000
HAM_DE_L	13	2	4	330000
HAM_DE_R	13	1	4	230000
HAM_HAW_L	9	2	4	315000
HAM_HAW_R	9	1	4	220000
HAM_PP_L	12	2	4	330000
HAM_SEA_L	11	2	4	365000
HAM_SEA_R	11	1	4	255000
HAM_VEG_L	10	2	4	315000
HAM_VEG_R	10	1	4	220000
HAW_L_P	9	2	1	300000
HAW_L_T	9	2	2	300000
HAW_R_P	9	1	1	205000
HAW_R_T	9	1	2	205000
BBQ_R_P	2	1	1	245000
KIMCHI_R_P	3	1	1	205000
CH_SUPER_L	5	2	3	330000
POTATO_R_P	6	1	1	205000
HOT_R_P	7	1	1	205000
GOLD_R_P	8	1	1	205000
CH_HAW_R	9	1	3	220000
CH_VEG_L	10	2	3	315000
CH_SEA_L	11	2	3	365000
CH_PP_L	12	2	3	330000
CH_DE_L	13	2	3	330000
CK_R_S	15	3	5	150000
CK_W_R	16	3	5	184000
CK_R_G	21	3	5	184000
KTC	45	3	5	49000
LEMON_JUICE	60	3	5	40000
CK_R_R	22	3	5	184000
MEAT_R	23	3	5	184000
SALAD_B	43	3	5	165000
WING_L	46	3	5	220000
WING_R	47	3	5	157000
7UP	51	3	5	30000
AQUAFINA	57	3	5	20000
MIRINDA	54	3	5	30000
PEPSI_15L	53	3	5	40000
TEXAS_R_P	1	1	1	245000
BBQ_R_T	2	1	2	245000
KIMCHI_R_T	3	1	2	205000
CH_SUPER_R	5	1	3	230000
POTATO_R_T	6	1	2	205000
HOT_R_T	7	1	2	205000
GOLD_R_T	8	1	2	205000
CH_HAW_L	9	2	3	315000
CH_VEG_R	10	1	3	220000
CH_SEA_R	11	1	3	255000
HAM_PP_R	12	1	4	230000
CH_DE_R	13	1	3	230000
MEAT_S	14	3	5	150000
APPLE_JUICE	61	3	5	40000
CK_W_G	20	3	5	184000
MEAT_G	24	3	5	184000
PEPSI	50	3	5	30000
SODA	56	3	5	35000
STING	55	3	5	30000
PEPSI_ZERO	52	3	5	30000
CK_HQ_6M	49	3	5	170000
CK_HQ_2M	48	3	5	59000
GB	44	3	5	49000
SALAD_A	42	3	5	195000
DO_G	41	3	5	189000
DO_R	40	3	5	189000
KIMCHI_G	39	3	5	178000
KIMCHI_R	38	3	5	178000
NA_G	37	3	5	178000
NA_R	36	3	5	178000
NA_S	35	3	5	157000
CAR_G	34	3	5	178000
CAR_R	33	3	5	178000
HOT_G	31	3	5	173000
HOT_R	30	3	5	173000
HOT_S	29	3	5	157000
PP_L_P	12	2	1	310000
PP_L_T	12	2	2	310000
PP_R_P	12	1	1	210000
PP_R_T	12	1	2	210000
SEA_L_P	11	2	1	355000
SEA_L_T	11	2	2	355000
SEA_R_P	11	1	1	245000
SEA_R_T	11	1	2	245000
VEG_L_P	10	2	1	300000
VEG_L_T	10	2	2	300000
VEG_R_P	10	1	1	205000
VEG_R_T	10	1	2	205000
TEXAS_L_P	1	2	1	355000
TUNA_R_P	4	1	1	205000
TUNA_R_T	4	1	2	205000
SEA_R_S	17	3	5	177000
SEA_W_S	18	3	5	177000
CK_W_S	19	3	5	150000
ORANGE_JUICE	59	3	5	40000
TIGER	58	3	5	37000
CAR_S	32	3	5	157000
SEA_W_G	28	3	5	195000
SEA_R_G	27	3	5	195000
SEA_W_R	26	3	5	195000
SEA_R_R	25	3	5	195000
\.


--
-- TOC entry 5209 (class 0 OID 150374)
-- Dependencies: 239
-- Data for Name: dishes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dishes (dish_id, category_id, dish_name, image, ingredient, dish_status) FROM stdin;
62	4	Garlic Bread (4 pieces)	\N	\N	f
63	4	Garlic Bread (8 pieces)	\N	\N	f
64	4	Garlic Bread (2 pieces)	\N	\N	f
65	1	Half-Half	\N	\N	f
2	1	BBQ Pizza	/uploads/dishes/dish_1782686584246.webp	Beef with BBQ Sauce, Onion, Green Pepper, Mozzarella Cheese	t
3	1	Kim Chi Pizza	/uploads/dishes/dish_1782686598517.webp	Kim Chi, Bacon, Mushroom, Onion, Green Pepper, Mozzarella Cheese	t
4	1	Tuna Pizza	/uploads/dishes/dish_1782686611345.webp	Tuna Fish with Mayonnaise, Onion, Green Pepper, Mozzarella	t
5	1	Super Supreme Pizza	/uploads/dishes/dish_1782686637962.webp	Pepperoni, Ham, Beef, Mushroom, Onion, Green Pepper, Black Olive, Mozzarella Cheese	t
6	1	Potato Pizza	/uploads/dishes/dish_1782686652389.webp	Potato, Bacon, Mushroom, Onion, Green Pepper, Mozzarella Cheese	t
7	1	Hot Pizza	/uploads/dishes/dish_1782686677105.jpg	Pepperoni, Mushroom, Onion, Green Pepper, Chilli Powder, Tabasco Sauce, Mozzarella Cheese	t
8	1	Gold Pizza	/uploads/dishes/dish_1782686687995.jpg	Sweet Potato, Onion, Green Pepper, Corn, Mozzarella Cheese	t
9	1	Hawaiian Pizza	/uploads/dishes/dish_1782686699909.jpg	Pineapple, Ham, Mozzarella Cheese	t
10	1	Vegetable Pizza	/uploads/dishes/dish_1782686717779.jpg	Mushroom, Onion, Green Pepper, Black Olive, Mozzarella Cheese	t
11	1	Seafood Pizza	/uploads/dishes/dish_1782686735204.jpg	Shrimp, Squid, Mushroom, Onion, Green Pepper, Mozzarella Cheese	t
12	1	Pepperoni Pizza	/uploads/dishes/dish_1782686744330.jpg	Pepperoni, Mozzarella Cheese	t
13	1	Deluxe Pizza	/uploads/dishes/dish_1782686751871.jpg	Tomato sauce, Mozzarella Cheese	t
14	3	Meat Spaghetti	/uploads/dishes/dish_1782686770318.jpg	Tomato sauce, Beef	t
15	3	Chicken Red Spaghetti	/uploads/dishes/dish_1782686778901.jpg	Chicken, Mushroom, Onion, Broccoli, Carrot, Tomato Sauce	t
17	3	Seafood Red Spaghetti	/uploads/dishes/dish_1782686786826.jpg	Shrimp, Squid, Mushroom, Onion, Broccoli, Tomato Sauce	t
21	2	Chicken Red Grantin	/uploads/dishes/dish_1782686922888.jpg	Chicken, Mushroom, Onion, Broccoli, Carrot, Tomato Sauce	t
22	2	Chicken Red Risotto	/uploads/dishes/dish_1782686928849.jpg	Chicken, Mushroom, Onion, Broccoli, Carrot, Tomato Sauce	t
23	2	Meat Risotto	/uploads/dishes/dish_1782686933574.jpg	Tomato sauce, Beef	t
42	4	Salad A (Giấm tây)	/uploads/dishes/dish_1782687127546.jpg	Balsamic Vinegar, Olive Oil, Salad, Vegetable	t
16	2	Chicken White Risotto	/uploads/dishes/dish_1782686798170.jpg	Chicken, Mushroom, Onion, Broccoli, Carrot,  Cream Sauce	t
19	3	Chicken White Spaghetti	/uploads/dishes/dish_1782686818545.jpg	Chicken, Mushroom, Onion, Broccoli,  Carrot, Cream Sauce	t
18	3	Seafood White Spaghetti	/uploads/dishes/dish_1782686805483.jpg	Shrimp, Squid, Mushroom, Onion, Broccoli, Cream  Sauce	t
60	5	Lemon Juice	/uploads/dishes/dish_1782686875005.jpg	\N	t
45	4	French Fries	/uploads/dishes/dish_1782687097238.jpg	\N	t
46	4	BBQ Wing (10 pieces)	/uploads/dishes/dish_1782687082840.jpg	\N	t
47	4	BBQ Wing (6 pieces)	/uploads/dishes/dish_1782687074891.jpg	\N	t
51	5	7 up	/uploads/dishes/dish_1782687004136.jpg	\N	t
59	5	Orange Juice	/uploads/dishes/dish_1782687010286.jpg	\N	t
54	5	Mirinda Orange	/uploads/dishes/dish_1782687038793.jpg	\N	t
53	5	Pepsi pet 1,5l	/uploads/dishes/dish_1782687043966.jpg	\N	t
1	1	Texas Pizza	/uploads/dishes/dish_1782647446133.jpg	Beefsteak, Mushroom, Onion, Green Pepper, Corn, Black Olive, Ham, Pepperoni, Tomato, Mozzarella Cheese	t
61	5	Apple Juice	/uploads/dishes/dish_1782686880252.jpg	\N	t
20	2	Chicken White Grantin	/uploads/dishes/dish_1782686916125.jpg	Chicken, Mushroom, Onion, Broccoli,  Carrot, Cream Sauce	t
24	2	Meat Grantin	/uploads/dishes/dish_1782686947305.jpg	Tomato sauce, Beef	t
50	5	Pepsi	/uploads/dishes/dish_1782686998508.jpg	\N	t
58	5	Tiger Beer	/uploads/dishes/dish_1782687016281.jpg	\N	t
57	5	Aquafina Water	/uploads/dishes/dish_1782687022113.jpg	\N	t
56	5	Soda	/uploads/dishes/dish_1782687027200.jpg	\N	t
55	5	Sting	/uploads/dishes/dish_1782687033035.jpg	\N	t
52	5	Pepsi zero	/uploads/dishes/dish_1782687048856.jpg	\N	t
49	4	Fried Chicken (6 pieces)	/uploads/dishes/dish_1782687062565.jpg	\N	t
48	4	Fried Chicken (2 pieces)	/uploads/dishes/dish_1782687069335.jpg	\N	t
44	4	Garlic Bread	/uploads/dishes/dish_1782687091480.jpg	\N	t
41	2	Double Cream Grantin	/uploads/dishes/dish_1782687134590.jpg	Mushroom, Onion, Bacon, Parmersan Cheese, Cream Sauce *2	t
40	2	Double Cream Risotto	/uploads/dishes/dish_1782687140485.jpg	Mushroom, Onion, Bacon, Parmersan Cheese, Cream Sauce *2	t
39	2	Kim Chi Grantin	/uploads/dishes/dish_1782687147685.jpg	Kim chi, Bacon, Mushroom, Onion, Broccoli, Tomato Sauce	t
38	2	Kim Chi Risotto	/uploads/dishes/dish_1782687153001.jpg	Kim chi, Bacon, Mushroom, Onion, Broccoli, Tomato Sauce	t
37	2	Napolitan Grantin	/uploads/dishes/dish_1782687158981.jpg	Saugage, Onion, Green Pepper, Broccoli, Tomato Sauce	t
35	3	Napolitan Spaghetti	/uploads/dishes/dish_1782687171157.jpg	Saugage, Onion, Green Pepper, Broccoli, Tomato Sauce	t
34	2	Carbonara Grantin	/uploads/dishes/dish_1782687179496.jpg	Mushroom, Onion, Bacon, Parmersan Cheese, Cream Sauce	t
32	3	Carbonara Spaghetti	/uploads/dishes/dish_1782687190493.jpg	Mushroom, Onion, Bacon, Parmersan Cheese, Cream Sauce	t
31	2	Chili Hot Grantin	/uploads/dishes/dish_1782687196460.jpg	Mushroom, Onion, Broccoli, Chili, Dry Chilli, Tabasco Sauce, Tomato sauce	t
29	3	Chili Hot Spaghetti	/uploads/dishes/dish_1782687210350.jpg	Mushroom, Onion, Broccoli, Chili, Dry Chilli, Tabasco Sauce, Tomato sauce	t
28	2	Seafood White Grantin	/uploads/dishes/dish_1782687218289.jpg	Shrimp, Squid, Mushroom, Onion, Broccoli, Cream Souce	t
27	2	Seafood Red Grantin	/uploads/dishes/dish_1782687224186.jpg	Shrimp, Squid, Mushroom, Onion, Broccoli, Tomato Souce	t
25	2	Seafood Red Risotto	/uploads/dishes/dish_1782687235458.jpg	Shrimp, Squid, Mushroom, Onion, Broccoli, Tomato Sauce	t
43	4	Salad B (Mayonnaise)	/uploads/dishes/dish_1782687106514.jpg	Thoudsand Island Dressing Sauce, Salad, Tomato, Corn, Baby Corn, Boiled Potato, Broccoli, Green Pepper, Pineapple, Cabbage, Red Cabbage	t
36	2	Napolitan Risotto	/uploads/dishes/dish_1782687165756.jpg	Saugage, Onion, Green Pepper, Broccoli, Tomato Sauce	t
33	2	Carbonara Risotto	/uploads/dishes/dish_1782687184361.jpg	Mushroom, Onion, Bacon, Parmersan Cheese, Cream Sauce	t
30	2	Chili Hot Risotto	/uploads/dishes/dish_1782687201535.jpg	Mushroom, Onion, Broccoli, Chili, Dry Chilli, Tabasco Sauce, Tomato sauce	t
26	2	Seafood White Risotto	/uploads/dishes/dish_1782687229160.jpg	Shrimp, Squid, Mushroom, Onion, Broccoli, Cream Sauce	t
\.


--
-- TOC entry 5211 (class 0 OID 150380)
-- Dependencies: 241
-- Data for Name: message_images; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.message_images (image_id, message_id, image_url, uploaded_at) FROM stdin;
\.


--
-- TOC entry 5213 (class 0 OID 150385)
-- Dependencies: 243
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (message_id, room_id, sender_type, sender_id, message_text, is_read, created_at) FROM stdin;
\.


--
-- TOC entry 5215 (class 0 OID 150394)
-- Dependencies: 245
-- Data for Name: order_item_combos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item_combos (order_item_combo_id, order_item_id, group_id, dish_price_id, is_half_half, order_combo_note) FROM stdin;
\.


--
-- TOC entry 5217 (class 0 OID 150400)
-- Dependencies: 247
-- Data for Name: order_item_half; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item_half (order_item_half_id, order_item_id, order_item_combo_id, dish_id, order_half_note) FROM stdin;
\.


--
-- TOC entry 5219 (class 0 OID 150406)
-- Dependencies: 249
-- Data for Name: order_item_toppings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item_toppings (order_item_topping_id, order_item_id, order_item_combo_id, order_item_half_id, topping_id, quantity, topping_price) FROM stdin;
\.


--
-- TOC entry 5221 (class 0 OID 150410)
-- Dependencies: 251
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (order_item_id, order_id, dish_price_id, combo_id, quantity, is_half_half, order_price, order_item_note) FROM stdin;
\.


--
-- TOC entry 5223 (class 0 OID 150416)
-- Dependencies: 253
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, user_id, payment_method, payment_status, total_price_dish, shipping_fee, discount_amount, total_order, order_note, created_at, order_status, shipped_at, estimated_delivery_time, arrived_at, completed_at, order_type, pickup_time, customer_name, customer_phone, customer_email, cancelled_at, confirmed_at, customer_latitude, customer_longitude, preparing_at, shipping_distance_meters, store_id, user_address_id) FROM stdin;
\.


--
-- TOC entry 5225 (class 0 OID 150422)
-- Dependencies: 255
-- Data for Name: policy_chapters; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policy_chapters (id, chapter_name, last_updated, created_at) FROM stdin;
chinh_sach_giao_hang	III. CHÍNH SÁCH GIAO HÀNG - PIZZA&PASTA INN	2026-06-01	2026-06-08 16:28:18.269923+07
bao_mat_thong_tin	II. CHÍNH SÁCH BẢO MẬT THÔNG TIN KHÁCH HÀNG PIZZA & PASTA INN	2026-06-08	2026-06-08 16:28:18.269923+07
chinh_sach_su_dung	I. ĐIỀU KHOẢN SỬ DỤNG WEBSITE PIZZA&PASTA INN	2026-06-08	2026-06-08 16:28:18.269923+07
\.


--
-- TOC entry 5226 (class 0 OID 150426)
-- Dependencies: 256
-- Data for Name: policy_sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policy_sections (id, chapter_id, section_number, title_section, display_order) FROM stdin;
31	chinh_sach_giao_hang	3.1	Phí giao hàng	3
32	chinh_sach_giao_hang	3.2	Thời gian giao hàng	2
33	chinh_sach_giao_hang	3.3	Hủy đơn hàng	1
19	bao_mat_thong_tin	2.1	MỤC ĐÍCH THU THẬP THÔNG TIN	4
20	bao_mat_thong_tin	2.2	THÔNG TIN CHÚNG TÔI THU THẬP	3
21	bao_mat_thong_tin	2.3	PHẠM VI SỬ DỤNG THÔNG TIN	2
22	bao_mat_thong_tin	2.4	CUNG CẤP CHO CÁC ĐƠN VỊ KHÁC	1
55	chinh_sach_su_dung	1.1	GIỚI THIỆU	7
56	chinh_sach_su_dung	1.2	ĐỐI TƯỢNG ÁP DỤNG	6
57	chinh_sach_su_dung	1.3	ĐĂNG KÝ VÀ QUẢN LÝ TÀI KHOẢN	5
58	chinh_sach_su_dung	1.4	CÁC HÀNH VI BỊ NGHIÊM CẤM	4
59	chinh_sach_su_dung	1.6	GIỚI HẠN TRÁCH NHIỆM	3
60	chinh_sach_su_dung	1.5	QUYỀN SỞ HỮU TRÍ TUỆ	2
61	chinh_sach_su_dung	1.7	BỒI THƯỜNG THIỆT HẠI	1
\.


--
-- TOC entry 5228 (class 0 OID 150431)
-- Dependencies: 258
-- Data for Name: policy_sub_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.policy_sub_item (id, section_id, item_number, content, display_order) FROM stdin;
60	31	-	Sau khi tiếp nhận đơn hàng, nhân viên Pizza & Pasta Inn sẽ liên hệ khách hàng để xác nhận đơn hàng, thời gian giao hàng và phí giao hàng (nếu có).	3
61	31	-	Thông tin xác nhận sẽ được gửi đến địa chỉ email mà khách hàng đã đăng ký khi đặt hàng;	2
62	31	-	Khách hàng có trách nhiệm kiểm tra và xác nhận các thông tin đơn hàng trước khi Pizza & Pasta Inn tiến hành chế biến và giao hàng.	1
63	32	\N	Thời gian hoạt động của các chi nhánh:	5
65	32	*	Pizza & Pasta Inn Chi nhánh Quận 7: từ 09:00 đến 21:00.	3
66	32	\N	Đối với các đơn hàng đã được xác nhận, thời gian giao hàng dự kiến từ 30 đến 60 phút kể từ thời điểm xác nhận đơn hàng.	2
67	32	\N	Thời gian giao hàng thực tế có thể thay đổi tùy thuộc vào khoảng cách, điều kiện giao thông, thời tiết hoặc các yếu tố khách quan khác.	1
68	33	-	Do đặc thù sản phẩm được chế biến ngay sau khi đơn hàng được xác nhận, khách hàng có nhu cầu hủy đơn hàng vui lòng liên hệ trực tiếp với Pizza & Pasta Inn qua số hotline trong thời gian sớm nhất;	5
69	33	-	Hiện tại, website chưa hỗ trợ chức năng hủy đơn hàng trực tuyến sau khi đơn hàng đã được gửi thành công;	4
70	33	-	Pizza & Pasta Inn chỉ xem xét hỗ trợ hủy đơn hàng trong trường hợp đơn hàng chưa được đưa vào quá trình chế biến;	3
71	33	-	Đối với các đơn hàng đã được xác nhận và đang trong quá trình chế biến hoặc đã hoàn tất chế biến, Pizza & Pasta Inn có quyền từ chối yêu cầu hủy đơn hàng nhằm đảm bảo chất lượng sản phẩm và hạn chế tổn thất phát sinh;	2
72	33	-	Trong trường hợp khách hàng từ chối nhận hàng hoặc hủy đơn hàng khi sản phẩm đã được chế biến, Pizza & Pasta Inn có quyền từ chối phục vụ hoặc áp dụng các biện pháp hạn chế giao dịch đối với các đơn hàng tiếp theo.	1
164	19	\N	Pizza&Pasta Inn chỉ thu thập và xử lý thông tin cá nhân của Người dùng cho các mục đích sau:	6
165	19	-	Xử lý và quản lý đơn hàng;	5
166	19	-	Giao hàng và hỗ trợ khách hàng;	4
168	19	-	Nâng cao chất lượng dịch vụ và trải nghiệm người dùng;	2
169	19	-	Gửi thông báo về đơn hàng, thanh toán và các thông tin liên quan đến dịch vụ.	1
170	20	\N	Pizza&Pasta Inn có thể thu thập các loại thông tin sau:	4
171	20	-	Thông tin cá nhân, bao gồm: họ và tên, số điện thoại, địa chỉ email và địa chỉ giao hàng;	3
172	20	-	Thông tin giao dịch, bao gồm: lịch sử mua hàng, phương thức thanh toán và giá trị đơn hàng;	2
173	20	-	Thông tin kỹ thuật, bao gồm: địa chỉ IP, loại trình duyệt, thiết bị truy cập, cookie và dữ liệu phân tích hành vi sử dụng Website.	1
174	21	\N	Thông tin cá nhân của Người dùng được sử dụng cho các mục đích sau:	7
175	21	-	Xác nhận và xử lý đơn hàng;	6
176	21	-	Thực hiện giao hàng và cung cấp dịch vụ hỗ trợ khách hàng;	5
177	21	-	Tiếp nhận, giải quyết khiếu nại và phản hồi của Người dùng;	4
178	21	-	Nâng cao chất lượng dịch vụ và trải nghiệm người dùng;	3
316	56	c)	Khách hàng thực hiện các giao dịch như đặt hàng, thanh toán, đổi trả hoặc sử dụng các dịch vụ liên quan.	2
317	56	d)	Các tổ chức, cá nhân, đối tác có liên quan đến việc cung cấp dịch vụ trên Website.	1
318	57		Khi đăng ký và sử dụng tài khoản trên Website, Người dùng cam kết:	6
319	57	a)	Cung cấp thông tin chính xác: Cung cấp đầy đủ, chính xác và cập nhật thông tin theo yêu cầu của hệ thống. Người dùng chịu trách nhiệm đối với mọi hậu quả phát sinh từ việc cung cấp thông tin không chính xác hoặc không đầy đủ.	5
320	57	c)	Chịu trách nhiệm sử dụng: Chịu trách nhiệm đối với mọi hoạt động và giao dịch phát sinh từ tài khoản của mình.	4
321	57	b)	Bảo mật tài khoản: Tự chịu trách nhiệm bảo mật thông tin đăng nhập, bao gồm tên đăng nhập và mật khẩu. Tài khoản chỉ được sử dụng bởi cá nhân hoặc tổ chức đã đăng ký và không được chuyển nhượng, cho thuê hoặc chia sẻ cho bên thứ ba.	3
322	57		Quyền xử lý vi phạm của Pizza&Pasta Inn: Pizza&Pasta Inn có quyền tạm ngừng, khóa hoặc chấm dứt tài khoản của Người dùng khi phát hiện hành vi gian lận, cung cấp thông tin sai lệch, sử dụng trái phép hệ thống, vi phạm Điều khoản sử dụng hoặc vi phạm quy định của pháp luật.	2
58	31	-	Miễn phí giao hàng đối với các đơn hàng có địa chỉ giao nhận trong phạm vi 4 km tính từ chi nhánh thực hiện giao hàng;	5
59	31	-	Đối với các đơn hàng ngoài phạm vi 4 km, phí giao hàng sẽ được xác định dựa trên khoảng cách thực tế và khu vực giao hàng;	4
64	32	*	Pizza & Pasta Inn Chi nhánh Quận 5: từ 10:00 đến 22:00;	4
167	19	-	Xác nhận và thực hiện các giao dịch thanh toán;	3
311	55		Các thay đổi sẽ được công bố trên Website và có hiệu lực kể từ thời điểm đăng tải.	3
312	55		Pizza&Pasta Inn có quyền sửa đổi, bổ sung hoặc cập nhật Điều khoản sử dụng vào bất kỳ thời điểm nào.	2
309	55		Chào mừng Người dùng đến với website Pizza&Pasta Inn tại tên miền PizzaPastaInn.com.vn (sau đây gọi là “Website”).	1
313	56		Điều khoản sử dụng này áp dụng đối với mọi tổ chức, cá nhân truy cập, đăng ký tài khoản, sử dụng dịch vụ hoặc thực hiện giao dịch trên Website, bao gồm:	5
314	56	a)	Người truy cập và sử dụng Website dưới mọi hình thức.	4
315	56	b)	Người dùng đăng ký, quản lý và sử dụng tài khoản thành viên.	3
179	21	-	Thực hiện các nghĩa vụ theo quy định của pháp luật hoặc theo yêu cầu của cơ quan nhà nước có thẩm quyền.	2
180	21	\N	Pizza & Pasta Inn cam kết không bán, cho thuê hoặc trao đổi thông tin cá nhân của Người dùng cho bên thứ ba vì mục đích thương mại, trừ trường hợp được Người dùng đồng ý hoặc pháp luật có quy định khác.	1
181	22	\N	Pizza&Pasta Inn chỉ chia sẻ thông tin cá nhân của Người dùng trong các trường hợp sau:	6
182	22	-	Đơn vị vận chuyển để thực hiện việc giao hàng;	5
183	22	-	Đơn vị cung cấp dịch vụ thanh toán để xử lý giao dịch;	4
184	22	-	Cơ quan nhà nước có thẩm quyền theo yêu cầu của pháp luật;	3
185	22	-	Đối tác công nghệ hỗ trợ vận hành, bảo trì và phát triển Website.	2
186	22	\N	Các tổ chức, cá nhân nhận thông tin có trách nhiệm bảo mật và sử dụng thông tin đúng mục đích theo quy định của pháp luật.	1
308	55		Điều khoản sử dụng này quy định quyền, nghĩa vụ và trách nhiệm của Pizza&Pasta Inn và Người dùng khi truy cập, sử dụng Website.	5
310	55		Bằng việc truy cập, đăng ký tài khoản, đặt hàng hoặc sử dụng bất kỳ dịch vụ nào trên Website, Người dùng xác nhận đã đọc, hiểu và đồng ý tuân thủ các Điều khoản sử dụng này.	4
326	58	b)	Can thiệp trái phép vào hệ thống: Truy cập trái phép, phát tán mã độc, virus hoặc thực hiện các hành vi gây ảnh hưởng đến hoạt động của Website.	5
328	58	c)	Gian lận giao dịch: Lợi dụng lỗi hệ thống, sử dụng phương thức thanh toán bất hợp pháp hoặc thực hiện các hành vi gian lận nhằm trục lợi.	4
327	58	d)	Xâm phạm quyền sở hữu trí tuệ: Sao chép, sử dụng, sửa đổi hoặc phân phối trái phép các nội dung, hình ảnh, logo và tài nguyên thuộc quyền sở hữu của Pizza & Pasta Inn.	3
338	60		Người dùng không được sao chép, chỉnh sửa, phân phối, khai thác thương mại, trích xuất dữ liệu hoặc sử dụng bất kỳ tài sản trí tuệ nào của Pizza&Pasta Inn dưới bất kỳ hình thức nào khi chưa có sự đồng ý trước bằng văn bản.	2
339	60		Mọi hành vi vi phạm quyền sở hữu trí tuệ sẽ bị xử lý theo quy định của pháp luật hiện hành.	1
340	61		Người dùng có trách nhiệm bồi thường cho Pizza & Pasta Inn đối với các thiệt hại, chi phí hoặc tổn thất phát sinh từ hành vi vi phạm Điều khoản sử dụng, vi phạm pháp luật hoặc xâm phạm quyền và lợi ích hợp pháp của Pizza & Pasta Inn hoặc bên thứ ba.	2
341	61		Trong trường hợp Pizza & Pasta Inn được xác định có lỗi theo quy định của pháp luật và gây thiệt hại trực tiếp cho Người dùng, việc bồi thường (nếu có) sẽ được thực hiện theo quy định pháp luật hiện hành.	1
323	57	d)	Thông báo vi phạm: Thông báo kịp thời cho Pizza&Pasta Inn khi phát hiện tài khoản bị truy cập trái phép hoặc có dấu hiệu mất an toàn thông tin để được hỗ trợ xử lý.	1
324	58		Người dùng không được thực hiện các hành vi sau khi sử dụng Website và dịch vụ của Pizza & Pasta Inn:	7
325	58	a)	Cung cấp thông tin sai lệch: Sử dụng thông tin giả mạo, không chính xác hoặc mạo danh tổ chức, cá nhân khác khi đăng ký tài khoản hoặc thực hiện giao dịch.	6
329	58	e)	Vi phạm pháp luật: Sử dụng Website cho các mục đích trái pháp luật hoặc thực hiện các hành vi bị cấm theo quy định của pháp luật Việt Nam.	2
330	58		Pizza&Pasta Inn có quyền từ chối cung cấp dịch vụ, tạm ngừng hoặc chấm dứt tài khoản của Người dùng đối với các trường hợp vi phạm mà không ảnh hưởng đến các quyền và biện pháp xử lý khác theo quy định của pháp luật.	1
331	59		Pizza&Pasta Inn không chịu trách nhiệm đối với các thiệt hại phát sinh từ:	6
332	59	-	Việc Người dùng cung cấp thông tin không chính xác hoặc không bảo mật tài khoản của mình;	5
333	59	-	Sự gián đoạn dịch vụ do bảo trì, nâng cấp hệ thống hoặc các sự cố kỹ thuật ngoài ý muốn;	4
334	59	-	Lỗi phát sinh từ hệ thống của bên thứ ba như cổng thanh toán, đơn vị vận chuyển hoặc nhà cung cấp dịch vụ viễn thông;	3
336	59	-	Các sự kiện bất khả kháng như thiên tai, hỏa hoạn, dịch bệnh, chiến tranh hoặc các sự kiện nằm ngoài khả năng kiểm soát hợp lý của Pizza&Pasta Inn.	2
335	59		Pizza & Pasta Inn sẽ nỗ lực khắc phục sự cố và hạn chế tối đa ảnh hưởng đến Người dùng trong phạm vi khả năng của mình.	1
337	60		Toàn bộ nội dung, hình ảnh, logo, nhãn hiệu, thiết kế giao diện (UI/UX), cơ sở dữ liệu và các thành phần khác trên Website thuộc quyền sở hữu hoặc quyền sử dụng hợp pháp của Pizza&Pasta Inn và được bảo hộ theo quy định của pháp luật.	3
\.


--
-- TOC entry 5230 (class 0 OID 150438)
-- Dependencies: 260
-- Data for Name: shop_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.shop_reviews (review_id, user_id, order_id, rating_star, comment, image_url, shop_reply, created_at, is_visible) FROM stdin;
\.


--
-- TOC entry 5232 (class 0 OID 150444)
-- Dependencies: 262
-- Data for Name: sizes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sizes (size_id, size_name, is_visible) FROM stdin;
1	Regular	t
2	Large	t
3	Standard	f
\.


--
-- TOC entry 5234 (class 0 OID 150449)
-- Dependencies: 264
-- Data for Name: stores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.stores (store_id, store_name, address, latitude, longitude, hotline, is_active) FROM stdin;
1	Pizza&PastaInn	C001 Phạm Thái Bường, Phường Tân Hưng, Tp Hồ Chí Minh	10.72805	106.71077	028 5412 1197 - 028 5412 1196	t
2	Pizza&PastaInn	21 Đ. Đào Tấn, An Đông, Hồ Chí Minh, Việt Nam	10.75213	106.67513	02839240343	t
\.


--
-- TOC entry 5243 (class 0 OID 150741)
-- Dependencies: 273
-- Data for Name: tb_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tb_transactions (id, gateway, transaction_date, account_number, sub_account, amount_in, amount_out, accumulated, code, transaction_content, reference_number, body, created_at, order_id) FROM stdin;
\.


--
-- TOC entry 5236 (class 0 OID 150455)
-- Dependencies: 266
-- Data for Name: toppings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.toppings (topping_id, topping_name, price_topping, size_id, is_for_pizza, is_for_spaghetti) FROM stdin;
2	Vegetable	15000	2	t	t
5	Beef	20000	1	t	f
6	Beef	40000	2	t	f
7	Sweet potato crust	20000	1	t	f
8	Sweet potato crust	40000	2	t	f
3	Cheese	25000	1	t	f
4	Cheese	50000	2	t	f
9	Cheese	20000	3	f	t
1	Vegetable	10000	1	f	t
\.


--
-- TOC entry 5238 (class 0 OID 150462)
-- Dependencies: 268
-- Data for Name: user_address; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_address (user_address_id, user_id, address_line, is_default) FROM stdin;
1	3	Happy Valley Lo H, Phường Tân Hưng, Thành phố Hồ Chí Minh	t
2	5	{"name":"Quyen","phone":"0944368230","address":"123 ABC, Phường Phú An, Thành phố Hồ Chí Minh","lat":null,"lon":null}	t
3	6	{"name":"Trường Nguyễn","phone":"0341720172","address":"Bconz Plaza, Phường Đông Hòa, Thành phố Hồ Chí Minh","lat":null,"lon":null}	t
4	7	{"name":"Trường Nguyễn Duy","phone":"0347680212","address":"Bcon Plaza, Phường Bình Dương, Thành phố Hồ Chí Minh","lat":null,"lon":null}	t
\.


--
-- TOC entry 5240 (class 0 OID 150468)
-- Dependencies: 270
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, username, email, phone, password, role, user_status, created_at, google_id, auth_provider, avatar, is_guest) FROM stdin;
2	Admin	admin@gmail.com	\N	$2b$10$lwkchjopCvSjuKGIdxlmH.K4YNvz093G.hZDQxmc/1sm0l9NB6l7.	admin	t	\N	\N	local	\N	f
3	Quyen	1150070037@sv.hcmunre.edu.vn	0123453456	\N	customer	t	2026-06-09 04:24:18.722+07	\N	local	\N	t
4	Quyen	1150070037@sv.hcmunre.edu.vn	0944368230	123456	customer	t	2026-06-09 12:42:50.445+07	\N	local	\N	t
5	Quyen	tulips1705@gmail.com	0944368230	$2b$10$pzHfUHOBaFpWQMk9jlWS2eKZS0VJ4g7RKI4SndTDRms/9bJQ7XVBe	customer	t	2026-06-09 13:05:15.136+07	\N	local	\N	f
7	Trường Nguyễn Duy	1150070048@sv.hcmunre.edu.vn	\N	\N	customer	t	2026-06-23 19:34:23.39+07	104769852553313079427	google	/uploads/avatars/avatar_1782218083415.jpg	f
6	Trường Nguyễn	truongnguyen1714@gmail.com	\N	\N	customer	t	2026-06-10 21:13:54.855+07	112522510347115202436	google	/uploads/avatars/avatar_1782664074859.jpg	f
\.


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 218
-- Name: cart_item_combos_cart_item_combo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_item_combos_cart_item_combo_id_seq', 50, true);


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 220
-- Name: cart_item_half_cart_item_half_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_item_half_cart_item_half_id_seq', 10, true);


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 222
-- Name: cart_item_topping_item_topping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_item_topping_item_topping_id_seq', 56, true);


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 224
-- Name: cart_items_cart_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cart_items_cart_item_id_seq', 76, true);


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 226
-- Name: carts_cart_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.carts_cart_id_seq', 12, true);


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 228
-- Name: categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_category_id_seq', 7, true);


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 230
-- Name: chat_rooms_room_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.chat_rooms_room_id_seq', 4, true);


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 233
-- Name: combo_items_combo_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.combo_items_combo_item_id_seq', 347, true);


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 235
-- Name: combos_combo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.combos_combo_id_seq', 1, false);


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 237
-- Name: crusts_crust_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.crusts_crust_id_seq', 5, true);


--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 240
-- Name: dishes_dish_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.dishes_dish_id_seq', 65, true);


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 242
-- Name: message_images_image_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.message_images_image_id_seq', 1, false);


--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 244
-- Name: messages_message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_message_id_seq', 1, false);


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 246
-- Name: order_item_combos_order_item_combo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_item_combos_order_item_combo_id_seq', 1, false);


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 248
-- Name: order_item_half_order_item_half_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_item_half_order_item_half_id_seq', 1, false);


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 250
-- Name: order_item_toppings_order_item_topping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_item_toppings_order_item_topping_id_seq', 1, false);


--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 252
-- Name: order_items_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_order_item_id_seq', 1, false);


--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 254
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 1, false);


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 257
-- Name: policy_sections_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.policy_sections_id_seq', 63, true);


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 259
-- Name: policy_sub_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.policy_sub_item_id_seq', 344, true);


--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 261
-- Name: shop_reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.shop_reviews_review_id_seq', 1, false);


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 263
-- Name: sizes_size_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sizes_size_id_seq', 3, true);


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 265
-- Name: stores_store_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.stores_store_id_seq', 2, true);


--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 272
-- Name: tb_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tb_transactions_id_seq', 1, false);


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 267
-- Name: toppings_topping_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.toppings_topping_id_seq', 9, true);


--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 269
-- Name: user_address_user_address_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_address_user_address_id_seq', 4, true);


--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 271
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 7, true);


--
-- TOC entry 4939 (class 2606 OID 150502)
-- Name: cart_item_combos cart_item_combos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_combos
    ADD CONSTRAINT cart_item_combos_pkey PRIMARY KEY (cart_item_combo_id);


--
-- TOC entry 4941 (class 2606 OID 150504)
-- Name: cart_item_half cart_item_half_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_half
    ADD CONSTRAINT cart_item_half_pkey PRIMARY KEY (cart_item_half_id);


--
-- TOC entry 4943 (class 2606 OID 150506)
-- Name: cart_item_topping cart_item_topping_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_topping
    ADD CONSTRAINT cart_item_topping_pkey PRIMARY KEY (item_topping_id);


--
-- TOC entry 4945 (class 2606 OID 150508)
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (cart_item_id);


--
-- TOC entry 4947 (class 2606 OID 150510)
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (cart_id);


--
-- TOC entry 4949 (class 2606 OID 150512)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (category_id);


--
-- TOC entry 4951 (class 2606 OID 150514)
-- Name: chat_rooms chat_rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_pkey PRIMARY KEY (room_id);


--
-- TOC entry 4953 (class 2606 OID 150516)
-- Name: combo_groups combo_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_groups
    ADD CONSTRAINT combo_groups_pkey PRIMARY KEY (group_id);


--
-- TOC entry 4955 (class 2606 OID 150518)
-- Name: combo_items combo_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_pkey PRIMARY KEY (combo_item_id);


--
-- TOC entry 4957 (class 2606 OID 150520)
-- Name: combos combos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_pkey PRIMARY KEY (combo_id);


--
-- TOC entry 4959 (class 2606 OID 150522)
-- Name: crusts crusts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.crusts
    ADD CONSTRAINT crusts_pkey PRIMARY KEY (crust_id);


--
-- TOC entry 4961 (class 2606 OID 150524)
-- Name: dish_prices dish_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_prices
    ADD CONSTRAINT dish_prices_pkey PRIMARY KEY (dish_price_id);


--
-- TOC entry 4963 (class 2606 OID 150526)
-- Name: dishes dishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_pkey PRIMARY KEY (dish_id);


--
-- TOC entry 4965 (class 2606 OID 150528)
-- Name: message_images message_images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_images
    ADD CONSTRAINT message_images_pkey PRIMARY KEY (image_id);


--
-- TOC entry 4967 (class 2606 OID 150530)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (message_id);


--
-- TOC entry 4969 (class 2606 OID 150532)
-- Name: order_item_combos order_item_combos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_combos
    ADD CONSTRAINT order_item_combos_pkey PRIMARY KEY (order_item_combo_id);


--
-- TOC entry 4971 (class 2606 OID 150534)
-- Name: order_item_half order_item_half_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_half
    ADD CONSTRAINT order_item_half_pkey PRIMARY KEY (order_item_half_id);


--
-- TOC entry 4973 (class 2606 OID 150536)
-- Name: order_item_toppings order_item_toppings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT order_item_toppings_pkey PRIMARY KEY (order_item_topping_id);


--
-- TOC entry 4975 (class 2606 OID 150538)
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- TOC entry 4977 (class 2606 OID 150540)
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- TOC entry 4979 (class 2606 OID 150542)
-- Name: policy_chapters policy_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_chapters
    ADD CONSTRAINT policy_chapters_pkey PRIMARY KEY (id);


--
-- TOC entry 4981 (class 2606 OID 150544)
-- Name: policy_sections policy_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_sections
    ADD CONSTRAINT policy_sections_pkey PRIMARY KEY (id);


--
-- TOC entry 4983 (class 2606 OID 150546)
-- Name: policy_sub_item policy_sub_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_sub_item
    ADD CONSTRAINT policy_sub_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4985 (class 2606 OID 150548)
-- Name: shop_reviews shop_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_reviews
    ADD CONSTRAINT shop_reviews_pkey PRIMARY KEY (review_id);


--
-- TOC entry 4987 (class 2606 OID 150550)
-- Name: sizes sizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sizes
    ADD CONSTRAINT sizes_pkey PRIMARY KEY (size_id);


--
-- TOC entry 4989 (class 2606 OID 150552)
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (store_id);


--
-- TOC entry 4999 (class 2606 OID 150752)
-- Name: tb_transactions tb_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_transactions
    ADD CONSTRAINT tb_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4991 (class 2606 OID 150554)
-- Name: toppings toppings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.toppings
    ADD CONSTRAINT toppings_pkey PRIMARY KEY (topping_id);


--
-- TOC entry 4993 (class 2606 OID 150556)
-- Name: user_address user_address_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_address
    ADD CONSTRAINT user_address_pkey PRIMARY KEY (user_address_id);


--
-- TOC entry 4995 (class 2606 OID 150558)
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- TOC entry 4997 (class 2606 OID 150560)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5000 (class 2606 OID 150561)
-- Name: cart_item_combos cart_item_combos_cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_combos
    ADD CONSTRAINT cart_item_combos_cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(cart_item_id);


--
-- TOC entry 5001 (class 2606 OID 150566)
-- Name: cart_item_half cart_item_half_cart_item_combo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_half
    ADD CONSTRAINT cart_item_half_cart_item_combo_id_fkey FOREIGN KEY (cart_item_combo_id) REFERENCES public.cart_item_combos(cart_item_combo_id);


--
-- TOC entry 5002 (class 2606 OID 150571)
-- Name: cart_item_half cart_item_half_cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_half
    ADD CONSTRAINT cart_item_half_cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(cart_item_id);


--
-- TOC entry 5003 (class 2606 OID 150576)
-- Name: cart_item_topping cart_item_topping_cart_item_combo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_topping
    ADD CONSTRAINT cart_item_topping_cart_item_combo_id_fkey FOREIGN KEY (cart_item_combo_id) REFERENCES public.cart_item_combos(cart_item_combo_id);


--
-- TOC entry 5004 (class 2606 OID 150581)
-- Name: cart_item_topping cart_item_topping_cart_item_half_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_topping
    ADD CONSTRAINT cart_item_topping_cart_item_half_id_fkey FOREIGN KEY (cart_item_half_id) REFERENCES public.cart_item_half(cart_item_half_id);


--
-- TOC entry 5005 (class 2606 OID 150586)
-- Name: cart_item_topping cart_item_topping_cart_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_item_topping
    ADD CONSTRAINT cart_item_topping_cart_item_id_fkey FOREIGN KEY (cart_item_id) REFERENCES public.cart_items(cart_item_id);


--
-- TOC entry 5006 (class 2606 OID 150591)
-- Name: cart_items cart_items_cart_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.carts(cart_id);


--
-- TOC entry 5007 (class 2606 OID 150596)
-- Name: carts carts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5008 (class 2606 OID 150601)
-- Name: chat_rooms chat_rooms_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.chat_rooms
    ADD CONSTRAINT chat_rooms_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5009 (class 2606 OID 150606)
-- Name: combo_groups combo_groups_combo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_groups
    ADD CONSTRAINT combo_groups_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES public.combos(combo_id) ON DELETE CASCADE;


--
-- TOC entry 5010 (class 2606 OID 150611)
-- Name: combo_items combo_items_dish_price_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_dish_price_id_fkey FOREIGN KEY (dish_price_id) REFERENCES public.dish_prices(dish_price_id) ON DELETE CASCADE;


--
-- TOC entry 5011 (class 2606 OID 150616)
-- Name: combo_items combo_items_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combo_items
    ADD CONSTRAINT combo_items_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.combo_groups(group_id) ON DELETE CASCADE;


--
-- TOC entry 5012 (class 2606 OID 150621)
-- Name: combos combos_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.combos
    ADD CONSTRAINT combos_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- TOC entry 5013 (class 2606 OID 150626)
-- Name: dish_prices dish_prices_crust_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_prices
    ADD CONSTRAINT dish_prices_crust_id_fkey FOREIGN KEY (crust_id) REFERENCES public.crusts(crust_id);


--
-- TOC entry 5014 (class 2606 OID 150631)
-- Name: dish_prices dish_prices_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_prices
    ADD CONSTRAINT dish_prices_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id) ON DELETE CASCADE;


--
-- TOC entry 5015 (class 2606 OID 150636)
-- Name: dish_prices dish_prices_size_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dish_prices
    ADD CONSTRAINT dish_prices_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(size_id);


--
-- TOC entry 5016 (class 2606 OID 150641)
-- Name: dishes dishes_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dishes
    ADD CONSTRAINT dishes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(category_id);


--
-- TOC entry 5017 (class 2606 OID 150646)
-- Name: message_images message_images_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.message_images
    ADD CONSTRAINT message_images_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(message_id) ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 150651)
-- Name: messages messages_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.chat_rooms(room_id) ON DELETE CASCADE;


--
-- TOC entry 5019 (class 2606 OID 150656)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(user_id);


--
-- TOC entry 5020 (class 2606 OID 150778)
-- Name: order_item_combos order_item_combos_dish_price_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_combos
    ADD CONSTRAINT order_item_combos_dish_price_id_fkey FOREIGN KEY (dish_price_id) REFERENCES public.dish_prices(dish_price_id);


--
-- TOC entry 5021 (class 2606 OID 150661)
-- Name: order_item_combos order_item_combos_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_combos
    ADD CONSTRAINT order_item_combos_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id);


--
-- TOC entry 5022 (class 2606 OID 150783)
-- Name: order_item_half order_item_half_dish_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_half
    ADD CONSTRAINT order_item_half_dish_id_fkey FOREIGN KEY (dish_id) REFERENCES public.dishes(dish_id);


--
-- TOC entry 5023 (class 2606 OID 150666)
-- Name: order_item_half order_item_half_order_item_combo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_half
    ADD CONSTRAINT order_item_half_order_item_combo_id_fkey FOREIGN KEY (order_item_combo_id) REFERENCES public.order_item_combos(order_item_combo_id);


--
-- TOC entry 5024 (class 2606 OID 150671)
-- Name: order_item_half order_item_half_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_half
    ADD CONSTRAINT order_item_half_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id);


--
-- TOC entry 5025 (class 2606 OID 150676)
-- Name: order_item_toppings order_item_toppings_order_item_combo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT order_item_toppings_order_item_combo_id_fkey FOREIGN KEY (order_item_combo_id) REFERENCES public.order_item_combos(order_item_combo_id);


--
-- TOC entry 5026 (class 2606 OID 150681)
-- Name: order_item_toppings order_item_toppings_order_item_half_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT order_item_toppings_order_item_half_id_fkey FOREIGN KEY (order_item_half_id) REFERENCES public.order_item_half(order_item_half_id);


--
-- TOC entry 5027 (class 2606 OID 150686)
-- Name: order_item_toppings order_item_toppings_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT order_item_toppings_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id);


--
-- TOC entry 5028 (class 2606 OID 150773)
-- Name: order_item_toppings order_item_toppings_topping_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_toppings
    ADD CONSTRAINT order_item_toppings_topping_id_fkey FOREIGN KEY (topping_id) REFERENCES public.toppings(topping_id);


--
-- TOC entry 5029 (class 2606 OID 150768)
-- Name: order_items order_items_combo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_combo_id_fkey FOREIGN KEY (combo_id) REFERENCES public.combos(combo_id);


--
-- TOC entry 5030 (class 2606 OID 150763)
-- Name: order_items order_items_dish_price_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_dish_price_id_fkey FOREIGN KEY (dish_price_id) REFERENCES public.dish_prices(dish_price_id);


--
-- TOC entry 5031 (class 2606 OID 150691)
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- TOC entry 5032 (class 2606 OID 150758)
-- Name: orders orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(store_id);


--
-- TOC entry 5033 (class 2606 OID 150753)
-- Name: orders orders_user_address_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_address_id_fkey FOREIGN KEY (user_address_id) REFERENCES public.user_address(user_address_id);


--
-- TOC entry 5034 (class 2606 OID 150696)
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5035 (class 2606 OID 150701)
-- Name: policy_sections policy_sections_chapter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_sections
    ADD CONSTRAINT policy_sections_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.policy_chapters(id) ON DELETE CASCADE;


--
-- TOC entry 5036 (class 2606 OID 150706)
-- Name: policy_sub_item policy_sub_item_section_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.policy_sub_item
    ADD CONSTRAINT policy_sub_item_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.policy_sections(id) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 150711)
-- Name: shop_reviews shop_reviews_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_reviews
    ADD CONSTRAINT shop_reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- TOC entry 5038 (class 2606 OID 150716)
-- Name: shop_reviews shop_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.shop_reviews
    ADD CONSTRAINT shop_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5041 (class 2606 OID 150788)
-- Name: tb_transactions tb_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tb_transactions
    ADD CONSTRAINT tb_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id);


--
-- TOC entry 5039 (class 2606 OID 150721)
-- Name: toppings toppings_size_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.toppings
    ADD CONSTRAINT toppings_size_id_fkey FOREIGN KEY (size_id) REFERENCES public.sizes(size_id);


--
-- TOC entry 5040 (class 2606 OID 150726)
-- Name: user_address user_address_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_address
    ADD CONSTRAINT user_address_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 5
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


-- Completed on 2026-06-29 06:04:04

--
-- PostgreSQL database dump complete
--

\unrestrict mjkZkJTbBiUVo2QTnl0sYxjBIUhGI34JLPsXpj027g3z4TDzSBR7ctPNLQpzN1N

