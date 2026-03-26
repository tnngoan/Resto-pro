import { PrismaClient, KitchenStation, UserRole, OrderStatus, OrderItemStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log("🌱 Starting database seed for The Red Chair restaurant...\n");

  try {
    // ========================================================================
    // 1. DELETE EXISTING DATA (for fresh seed)
    // ========================================================================
    console.log("🗑️  Cleaning up existing data...");

    // Delete in order to respect foreign key constraints
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.recipe.deleteMany({});
    await prisma.stockMovement.deleteMany({});
    await prisma.ingredient.deleteMany({});
    await prisma.menuItem.deleteMany({});
    await prisma.menuCategory.deleteMany({});
    await prisma.table.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.dailyRevenue.deleteMany({});
    await prisma.restaurant.deleteMany({});

    console.log("✓ Database cleaned\n");

    // ========================================================================
    // 2. CREATE RESTAURANT
    // ========================================================================
    console.log("🏠 Creating restaurant: The Red Chair");

    const restaurant = await prisma.restaurant.create({
      data: {
        name: "The Red Chair",
        nameVi: "The Red Chair",
        slug: "the-red-chair",
        address: "598/58 Điện Biên Phủ, Thạnh Mỹ Tây, TP.HCM",
        phone: "+84 28 1234 5678",
        email: "info@theredchair.vn",
        vatRate: 8,
        currency: "VND",
        timezone: "Asia/Ho_Chi_Minh",
        isActive: true,
      },
    });

    console.log(`✓ Restaurant created: ${restaurant.id}\n`);

    // ========================================================================
    // 3. CREATE USERS
    // ========================================================================
    console.log("👥 Creating users...");

    const ownerPasswordHash = await hashPassword("admin123");
    const managerPasswordHash = await hashPassword("manager123");
    const staffPasswordHash = await hashPassword("staff123");
    const kitchenPasswordHash = await hashPassword("kitchen123");

    const owner = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: "owner@theredchair.vn",
        passwordHash: ownerPasswordHash,
        name: "Chủ nhà hàng",
        role: UserRole.OWNER,
        isActive: true,
      },
    });

    const manager = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: "manager@theredchair.vn",
        passwordHash: managerPasswordHash,
        name: "Quản lý",
        role: UserRole.MANAGER,
        isActive: true,
      },
    });

    const staff = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: "staff@theredchair.vn",
        passwordHash: staffPasswordHash,
        name: "Phục vụ",
        role: UserRole.STAFF,
        isActive: true,
      },
    });

    const kitchen = await prisma.user.create({
      data: {
        restaurantId: restaurant.id,
        email: "kitchen@theredchair.vn",
        passwordHash: kitchenPasswordHash,
        name: "Bếp trưởng",
        role: UserRole.KITCHEN,
        isActive: true,
      },
    });

    console.log(`✓ Created 4 users: Owner, Manager, Staff, Kitchen\n`);

    // ========================================================================
    // 4. CREATE MENU CATEGORIES
    // ========================================================================
    console.log("📚 Creating menu categories...");

    const categories = await Promise.all([
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Khai vị",
          nameIt: "Antipasti",
          slug: generateSlug("Khai vị"),
          description: "Các món khai vị truyền thống Ý",
          sortOrder: 1,
          isActive: true,
        },
      }),
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Pizza",
          nameIt: "Pizza",
          slug: generateSlug("Pizza"),
          description: "Pizza nướng lò truyền thống",
          sortOrder: 2,
          isActive: true,
        },
      }),
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Pasta",
          nameIt: "Pasta",
          slug: generateSlug("Pasta"),
          description: "Mì Ý được chế biến tươi mỗi ngày",
          sortOrder: 3,
          isActive: true,
        },
      }),
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Thịt & Cá",
          nameIt: "Carne e Pesce",
          slug: generateSlug("Thịt & Cá"),
          description: "Các món thịt và cá nướng cao cấp",
          sortOrder: 4,
          isActive: true,
        },
      }),
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Tráng miệng",
          nameIt: "Dolci",
          slug: generateSlug("Tráng miệng"),
          description: "Các món tráng miệng Ý tuyệt vời",
          sortOrder: 5,
          isActive: true,
        },
      }),
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Đồ uống",
          nameIt: "Bevande",
          slug: generateSlug("Đồ uống"),
          description: "Cà phê, nước uống không cồn",
          sortOrder: 6,
          isActive: true,
        },
      }),
      prisma.menuCategory.create({
        data: {
          restaurantId: restaurant.id,
          name: "Rượu vang",
          nameIt: "Vini",
          slug: generateSlug("Rượu vang"),
          description: "Rượu vang Ý cao cấp",
          sortOrder: 7,
          isActive: true,
        },
      }),
    ]);

    console.log(`✓ Created 7 menu categories\n`);

    // ========================================================================
    // 5. CREATE MENU ITEMS
    // ========================================================================
    console.log("🍽️  Creating menu items...");

    const menuItems = await Promise.all([
      // ---- ANTIPASTI (Khai vị) ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[0].id,
          name: "Salad Caesar",
          nameIt: "Caesar Salad",
          description: "Salad tươi với croutons, parmigiano reggiano và sốt caesar tự chế",
          descriptionIt: "Salad fresco con croutons, parmigiano reggiano e salsa caesar fatta in casa",
          price: 149000,
          station: KitchenStation.COLD_KITCHEN,
          prepTimeMinutes: 5,
          isAvailable: true,
          tags: ["vegetarian", "fresh"],
          allergens: ["dairy", "eggs"],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[0].id,
          name: "Bruschetta al Pomodoro",
          nameIt: "Bruschetta al Pomodoro",
          description: "Bánh mì nướng với cà chua tươi, tỏi, dầu olive và lá húng quế",
          descriptionIt: "Pane tostato con pomodoro fresco, aglio, olio d'oliva e basilico",
          price: 129000,
          station: KitchenStation.COLD_KITCHEN,
          prepTimeMinutes: 5,
          isAvailable: true,
          tags: ["vegetarian", "traditional"],
          allergens: [],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[0].id,
          name: "Carpaccio di Manzo",
          nameIt: "Carpaccio di Manzo",
          description: "Thịt bò tươi cắt mỏng với dầu olive, chanh và parmigiano",
          descriptionIt: "Manzo fresco affettato sottile con olio d'oliva, limone e parmigiano",
          price: 219000,
          station: KitchenStation.COLD_KITCHEN,
          prepTimeMinutes: 5,
          isAvailable: true,
          tags: ["premium", "raw"],
          allergens: ["dairy"],
          sortOrder: 3,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[0].id,
          name: "Minestrone",
          nameIt: "Minestrone",
          description: "Canh rau tối tưởng với đậu, khoai tây, cà chua và lòng mề",
          descriptionIt: "Zuppa di verdure con fagioli, patate, pomodori e pasta",
          price: 119000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 10,
          isAvailable: true,
          tags: ["vegetarian", "comfort"],
          allergens: [],
          sortOrder: 4,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[0].id,
          name: "Mozzarella Tươi",
          nameIt: "Mozzarella di Bufala",
          description: "Phô mai mozzarella tươi với cà chua, dầu olive nguyên chất",
          descriptionIt: "Mozzarella fresca di bufala con pomodoro e olio d'oliva",
          price: 179000,
          station: KitchenStation.COLD_KITCHEN,
          prepTimeMinutes: 3,
          isAvailable: true,
          tags: ["vegetarian", "premium"],
          allergens: ["dairy"],
          sortOrder: 5,
        },
      }),

      // ---- PIZZA ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[1].id,
          name: "Margherita",
          nameIt: "Margherita",
          description: "Pizza cổ điển với cà chua, mozzarella tươi và lá húng quế",
          descriptionIt: "Pizza classica con pomodoro, mozzarella fresca e basilico",
          price: 189000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 12,
          isAvailable: true,
          tags: ["vegetarian", "classic"],
          allergens: ["dairy", "gluten"],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[1].id,
          name: "Pepperoni",
          nameIt: "Pepperoni",
          description: "Pizza với sốc xúc xích Ý, phô mai mozzarella",
          descriptionIt: "Pizza con pepperoni italiano e mozzarella",
          price: 219000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 12,
          isAvailable: true,
          tags: ["meat", "classic"],
          allergens: ["dairy", "gluten"],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[1].id,
          name: "Quattro Formaggi",
          nameIt: "Quattro Formaggi",
          description: "Pizza với 4 loại phô mai: mozzarella, gorgonzola, ricotta, parmigiano",
          descriptionIt: "Pizza con quattro formaggi: mozzarella, gorgonzola, ricotta, parmigiano",
          price: 239000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 12,
          isAvailable: true,
          tags: ["vegetarian", "cheese"],
          allergens: ["dairy", "gluten"],
          sortOrder: 3,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[1].id,
          name: "Diavola",
          nameIt: "Diavola",
          description: "Pizza cay với pepperoni, peperoncini và mozzarella",
          descriptionIt: "Pizza piccante con pepperoni e peperoncini",
          price: 229000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 12,
          isAvailable: true,
          tags: ["meat", "spicy"],
          allergens: ["dairy", "gluten"],
          sortOrder: 4,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[1].id,
          name: "Pizza Nấm Truffle",
          nameIt: "Truffle Mushroom Pizza",
          description: "Pizza với nấm, dầu truffle, mozzarella tươi",
          descriptionIt: "Pizza ai funghi con tartufo e mozzarella fresca",
          price: 289000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 13,
          isAvailable: true,
          tags: ["vegetarian", "premium"],
          allergens: ["dairy", "gluten"],
          sortOrder: 5,
        },
      }),

      // ---- PASTA ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[2].id,
          name: "Spaghetti Bolognese",
          nameIt: "Spaghetti Bolognese",
          description: "Spaghetti với nước sốt thịt bò slow-cooked chuẩn Bologna",
          descriptionIt: "Spaghetti con ragù di manzo cotto lentamente",
          price: 189000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 10,
          isAvailable: true,
          tags: ["meat", "classic"],
          allergens: ["dairy", "gluten"],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[2].id,
          name: "Carbonara",
          nameIt: "Carbonara",
          description: "Spaghetti với nước sốt kem, trứng, guanciale và parmigiano",
          descriptionIt: "Spaghetti con crema, uova, guanciale e parmigiano",
          price: 199000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 10,
          isAvailable: true,
          tags: ["meat", "classic"],
          allergens: ["dairy", "gluten", "eggs"],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[2].id,
          name: "Aglio e Olio",
          nameIt: "Aglio e Olio",
          description: "Spaghetti đơn giản với tỏi, dầu olive, ớt và rau mùi tây",
          descriptionIt: "Spaghetti semplice con aglio, olio di oliva, peperoncino e prezzemolo",
          price: 169000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 8,
          isAvailable: true,
          tags: ["vegetarian", "classic"],
          allergens: ["gluten"],
          sortOrder: 3,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[2].id,
          name: "Penne Arrabbiata",
          nameIt: "Penne Arrabbiata",
          description: "Penne với nước sốt cà chua cay, tỏi và ớt",
          descriptionIt: "Penne con salsa di pomodoro, aglio e peperoncino",
          price: 179000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 9,
          isAvailable: true,
          tags: ["vegetarian", "spicy"],
          allergens: ["gluten"],
          sortOrder: 4,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[2].id,
          name: "Linguine Hải Sản",
          nameIt: "Seafood Linguine",
          description: "Linguine với tôm, mực, vỏ sò và nước sốt cà chua trắng",
          descriptionIt: "Linguine con gamberi, calamari, vongole e salsa di pomodoro bianca",
          price: 259000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 11,
          isAvailable: true,
          tags: ["seafood", "premium"],
          allergens: ["seafood", "gluten"],
          sortOrder: 5,
        },
      }),

      // ---- CARNE E PESCE (Thịt & Cá) ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[3].id,
          name: "Bistecca alla Fiorentina",
          nameIt: "Bistecca alla Fiorentina",
          description: "Sườn bò tươi nướng trên lửa với hương thơm đặc trưng, dầu olive",
          descriptionIt: "Bistecca di manzo affettato alla griglia con olio d'oliva",
          price: 589000,
          station: KitchenStation.GRILL,
          prepTimeMinutes: 15,
          isAvailable: true,
          tags: ["meat", "premium", "signature"],
          allergens: [],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[3].id,
          name: "Osso Buco",
          nameIt: "Osso Buco",
          description: "Cốt thịt bê được nấu với rượu trắng, canh dùm đậy trong 2-3 giờ",
          descriptionIt: "Stinco di vitello brasato con vino bianco per ore",
          price: 429000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 30,
          isAvailable: true,
          tags: ["meat", "premium", "slow-cooked"],
          allergens: [],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[3].id,
          name: "Cá Hồi Nướng",
          nameIt: "Salmone alla Griglia",
          description: "Cá hồi tươi nướng trên lửa với chanh, thảo mộc tây",
          descriptionIt: "Salmone fresco alla griglia con limone e erbe aromatiche",
          price: 349000,
          station: KitchenStation.GRILL,
          prepTimeMinutes: 12,
          isAvailable: true,
          tags: ["seafood", "premium"],
          allergens: ["seafood"],
          sortOrder: 3,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[3].id,
          name: "Gà nướng Parmigiana",
          nameIt: "Pollo alla Parmigiana",
          description: "Gà nướng với phô mai mozzarella, cà chua và parmigiano",
          descriptionIt: "Pollo alla griglia con mozzarella, pomodoro e parmigiano",
          price: 289000,
          station: KitchenStation.HOT_KITCHEN,
          prepTimeMinutes: 18,
          isAvailable: true,
          tags: ["meat"],
          allergens: ["dairy"],
          sortOrder: 4,
        },
      }),

      // ---- DOLCI (Tráng miệng) ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[4].id,
          name: "Tiramisu",
          nameIt: "Tiramisu",
          description: "Tráng miệng Ý cổ điển với mascarpone, espresso và cacao",
          descriptionIt: "Dolce italiano classico con mascarpone, espresso e cacao",
          price: 109000,
          station: KitchenStation.DESSERT,
          prepTimeMinutes: 2,
          isAvailable: true,
          tags: ["vegetarian", "classic"],
          allergens: ["dairy", "eggs", "gluten"],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[4].id,
          name: "Panna Cotta",
          nameIt: "Panna Cotta",
          description: "Kem cứng nhẹ với vị vanilla và sốt quả mọng",
          descriptionIt: "Crema dolce con vaniglia e salsa di frutti di bosco",
          price: 99000,
          station: KitchenStation.DESSERT,
          prepTimeMinutes: 2,
          isAvailable: true,
          tags: ["vegetarian", "light"],
          allergens: ["dairy"],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[4].id,
          name: "Cannoli Siciliani",
          nameIt: "Cannoli",
          description: "Bánh cannoli xù xì với nhân kem ricotta và sô cô la",
          descriptionIt: "Cannoli croccanti con ripieno di ricotta e cioccolato",
          price: 119000,
          station: KitchenStation.DESSERT,
          prepTimeMinutes: 3,
          isAvailable: true,
          tags: ["vegetarian", "traditional"],
          allergens: ["dairy", "gluten"],
          sortOrder: 3,
        },
      }),

      // ---- BEVANDE (Đồ uống) ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[5].id,
          name: "Espresso",
          nameIt: "Espresso",
          description: "Cà phê đen đặc đúc theo phong cách Ý",
          descriptionIt: "Caffè espresso italiano",
          price: 59000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 2,
          isAvailable: true,
          tags: ["coffee"],
          allergens: [],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[5].id,
          name: "Cappuccino",
          nameIt: "Cappuccino",
          description: "Cà phê với sữa nóng và bọt sữa mịn",
          descriptionIt: "Caffè con latte caldo e schiuma di latte",
          price: 79000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 3,
          isAvailable: true,
          tags: ["coffee"],
          allergens: ["dairy"],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[5].id,
          name: "Limonata Tươi",
          nameIt: "Limonata",
          description: "Nước chanh tươi làm từ chanh Sicily",
          descriptionIt: "Limonata fresca fatta con limoni di Sicilia",
          price: 69000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 3,
          isAvailable: true,
          tags: ["refreshing", "vegetarian"],
          allergens: [],
          sortOrder: 3,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[5].id,
          name: "Nước Khoáng",
          nameIt: "Acqua Minerale",
          description: "Nước khoáng tự nhiên",
          descriptionIt: "Acqua minerale naturale",
          price: 39000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 1,
          isAvailable: true,
          tags: ["beverage"],
          allergens: [],
          sortOrder: 4,
        },
      }),

      // ---- VINI (Rượu vang) ----
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[6].id,
          name: "Chianti Classico (ly)",
          nameIt: "Chianti Classico (glass)",
          description: "Rượu vang đỏ Ý tuyệt vời từ Tuscany",
          descriptionIt: "Vino rosso italiano eccellente da Toscana",
          price: 189000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 1,
          isAvailable: true,
          tags: ["wine", "red"],
          allergens: [],
          sortOrder: 1,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[6].id,
          name: "Prosecco (ly)",
          nameIt: "Prosecco (glass)",
          description: "Rượu vang trắng có gas nhẹ nhàng từ Venetia",
          descriptionIt: "Vino bianco frizzante delicato dal Veneto",
          price: 169000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 1,
          isAvailable: true,
          tags: ["wine", "white", "sparkling"],
          allergens: [],
          sortOrder: 2,
        },
      }),
      prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[6].id,
          name: "Pinot Grigio (ly)",
          nameIt: "Pinot Grigio (glass)",
          description: "Rượu vang trắng tươi mát từ miền Bắc Ý",
          descriptionIt: "Vino bianco fresco dal nord Italia",
          price: 179000,
          station: KitchenStation.BAR,
          prepTimeMinutes: 1,
          isAvailable: true,
          tags: ["wine", "white"],
          allergens: [],
          sortOrder: 3,
        },
      }),
    ]);

    console.log(`✓ Created 28 menu items\n`);

    // ========================================================================
    // 6. CREATE TABLES
    // ========================================================================
    console.log("🪑 Creating tables...");

    const tables = await Promise.all([
      // Tầng 1 - 4 người
      ...Array.from({ length: 8 }, (_, i) =>
        prisma.table.create({
          data: {
            restaurantId: restaurant.id,
            name: `Bàn ${i + 1}`,
            capacity: 4,
            zone: "Tầng 1",
            status: "AVAILABLE",
            isActive: true,
          },
        })
      ),
      // Tầng 1 - 6 người
      ...Array.from({ length: 2 }, (_, i) =>
        prisma.table.create({
          data: {
            restaurantId: restaurant.id,
            name: `Bàn ${i + 9}`,
            capacity: 6,
            zone: "Tầng 1",
            status: "AVAILABLE",
            isActive: true,
          },
        })
      ),
      // Tầng 2 - VIP 8 người
      ...Array.from({ length: 2 }, (_, i) =>
        prisma.table.create({
          data: {
            restaurantId: restaurant.id,
            name: `VIP ${i + 1}`,
            capacity: 8,
            zone: "Tầng 2",
            status: "AVAILABLE",
            isActive: true,
          },
        })
      ),
    ]);

    console.log(`✓ Created 12 tables (8 x 4-seater, 2 x 6-seater, 2 x VIP 8-seater)\n`);

    // ========================================================================
    // 7. CREATE SAMPLE ORDER
    // ========================================================================
    console.log("📋 Creating sample order...");

    const sampleOrder = await prisma.order.create({
      data: {
        restaurantId: restaurant.id,
        tableId: tables[0].id,
        orderNumber: 1,
        status: OrderStatus.CONFIRMED,
        subtotal: 648000,
        vatAmount: 51840,
        discountAmount: 0,
        total: 699840,
        paymentMethod: null,
        notes: "Đặc biệt: không cay, không tỏi",
        serverId: staff.id,
        covers: 2,
        isRush: false,
        isVip: false,
        createdAt: new Date(),
      },
    });

    // Add order items
    await Promise.all([
      prisma.orderItem.create({
        data: {
          orderId: sampleOrder.id,
          menuItemId: menuItems[6].id, // Margherita
          name: "Margherita",
          nameIt: "Margherita",
          quantity: 1,
          unitPrice: 189000,
          totalPrice: 189000,
          status: OrderItemStatus.PREPARING,
          station: KitchenStation.HOT_KITCHEN,
          modifications: [],
          notes: "Thêm basilico tươi",
          sortOrder: 1,
        },
      }),
      prisma.orderItem.create({
        data: {
          orderId: sampleOrder.id,
          menuItemId: menuItems[16].id, // Carbonara
          name: "Carbonara",
          nameIt: "Carbonara",
          quantity: 1,
          unitPrice: 199000,
          totalPrice: 199000,
          status: OrderItemStatus.PENDING,
          station: KitchenStation.HOT_KITCHEN,
          modifications: [],
          notes: "",
          sortOrder: 2,
        },
      }),
      prisma.orderItem.create({
        data: {
          orderId: sampleOrder.id,
          menuItemId: menuItems[32].id, // Tiramisu
          name: "Tiramisu",
          nameIt: "Tiramisu",
          quantity: 2,
          unitPrice: 109000,
          totalPrice: 218000,
          status: OrderItemStatus.PENDING,
          station: KitchenStation.DESSERT,
          modifications: [],
          notes: "",
          sortOrder: 3,
        },
      }),
      prisma.orderItem.create({
        data: {
          orderId: sampleOrder.id,
          menuItemId: menuItems[37].id, // Cappuccino
          name: "Cappuccino",
          nameIt: "Cappuccino",
          quantity: 2,
          unitPrice: 79000,
          totalPrice: 158000,
          status: OrderItemStatus.PENDING,
          station: KitchenStation.BAR,
          modifications: [],
          notes: "",
          sortOrder: 4,
        },
      }),
    ]);

    console.log(`✓ Created sample order with 4 items\n`);

    // ========================================================================
    // 8. CREATE BASIC INGREDIENTS (for recipe linking)
    // ========================================================================
    console.log("🥕 Creating basic ingredients...");

    const ingredients = await Promise.all([
      prisma.ingredient.create({
        data: {
          restaurantId: restaurant.id,
          name: "Mozzarella Tươi",
          unit: "kg",
          currentStock: 10,
          minStock: 3,
          costPerUnit: 80000,
          supplierName: "Supplier A",
          isActive: true,
        },
      }),
      prisma.ingredient.create({
        data: {
          restaurantId: restaurant.id,
          name: "Cà Chua Tươi",
          unit: "kg",
          currentStock: 20,
          minStock: 5,
          costPerUnit: 15000,
          supplierName: "Supplier B",
          isActive: true,
        },
      }),
      prisma.ingredient.create({
        data: {
          restaurantId: restaurant.id,
          name: "Pasta Spaghetti",
          unit: "kg",
          currentStock: 15,
          minStock: 5,
          costPerUnit: 25000,
          supplierName: "Supplier C",
          isActive: true,
        },
      }),
    ]);

    console.log(`✓ Created 3 basic ingredients\n`);

    // ========================================================================
    // SUCCESS
    // ========================================================================
    console.log("=" + "=".repeat(69));
    console.log("✅ DATABASE SEED COMPLETED SUCCESSFULLY");
    console.log("=" + "=".repeat(69));
    console.log("\n📊 SUMMARY:");
    console.log(`  • Restaurant: The Red Chair (${restaurant.id})`);
    console.log(`  • Users: 4 (Owner, Manager, Staff, Kitchen)`);
    console.log(`  • Menu Categories: 7`);
    console.log(`  • Menu Items: 28`);
    console.log(`  • Tables: 12`);
    console.log(`  • Sample Order: 1 (CONFIRMED with 4 items)`);
    console.log(`  • Ingredients: 3`);
    console.log("\n🔑 LOGIN CREDENTIALS:");
    console.log(`  Owner:    owner@theredchair.vn / admin123`);
    console.log(`  Manager:  manager@theredchair.vn / manager123`);
    console.log(`  Staff:    staff@theredchair.vn / staff123`);
    console.log(`  Kitchen:  kitchen@theredchair.vn / kitchen123`);
    console.log("\n" + "=".repeat(70));
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  }
}

// ============================================================================
// RUN SEED
// ============================================================================

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
